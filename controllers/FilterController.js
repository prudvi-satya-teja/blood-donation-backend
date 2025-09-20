
const axios = require('axios');
const moment = require('moment');

const StudentSchema = require('../models/StudentSchema');
const StaffSchema = require('../models/StaffSchema');
const managementandguest = require('../models/managementandguest');

const RegisterSchema = require('../models/RegistrationSchema');
const VolunteerSchema = require('../models/VolunteerSchema');

const EventSchema = require('../models/EventSchema');
const GallerySchema = require('../models/GallerySchema');



/* 
    BloodGroupHandler,
    DonorCountHandler,
    EventsDataHandler,
    GalleryDataHandler,
    GenderCountHandler,
    LiveCountHandler,
    OverviewCountsHandler,
    VolunteersDataHandler
*/
const BloodGroupHandler = async (req, res) => {
    try {
        const { College, EventDate } = req.query;

        const toDate = new Date();
        toDate.setUTCHours(23, 59, 59, 999);
        const fromDate = new Date();
        fromDate.setUTCHours(0, 0, 0, 0);

        const matchStage = {};
        if (College) {
            matchStage.College = College;
        }
        else if (EventDate) {
        
            matchStage.EventDate = { $gte: fromDate, $lt: toDate };
        }


        const aggregationPipeline = [];
        if (Object.keys(matchStage).length > 0) {
            aggregationPipeline.push({ $match: matchStage });
        }
        aggregationPipeline.push({
            $group: {
                _id: "$BloodGroup",
                donorCount: { $sum: 1 }
            }
        });

        const [studentCount, staffCount, managementCount] = await Promise.all([
            StudentSchema.aggregate(aggregationPipeline),
            StaffSchema.aggregate(aggregationPipeline),
            managementandguest.aggregate(aggregationPipeline)
        ]);

        const mergedCounts = {};
        const addCounts = (counts) => {
            counts.forEach(({ _id, donorCount }) => {
                if (!mergedCounts[_id]) {
                    mergedCounts[_id] = 0;
                }
                mergedCounts[_id] += donorCount;
            });
        };

        addCounts(studentCount);
        addCounts(staffCount);
        addCounts(managementCount);

        // Sort the keys of the mergedCounts object
        const sortedMergedCounts = Object.keys(mergedCounts)
            .sort()
            .reduce((acc, key) => {
                acc[key] = mergedCounts[key];
                return acc;
            }, {});

        console.log(sortedMergedCounts);
        return res.status(200).json(sortedMergedCounts);
    } catch (error) {
        console.error(error);
        return res.status(404).json({ message: 'Server Error' });
    }
};


// --------------------------------------------------------------------------------------------------------------------------------


const DonorCountHandler = async (req, res) => {
    try {
        const { collegeCode, EventDate, Department } = req.query;
        const toDate = new Date();
        toDate.setUTCHours(23, 59, 59, 999);
        const fromDate = new Date();
        fromDate.setUTCHours(0, 0, 0, 0);

        const matchStage = {};
        if (collegeCode) {
            matchStage.collegeCode = collegeCode;
        } else if (EventDate) {
            matchStage.EventDate = { $gte: fromDate, $lt: toDate };
        }

        const aggregationPipeline = [];
        if (Object.keys(matchStage).length > 0) {
            aggregationPipeline.push({ $match: matchStage });
        }

        let groupStage;
        if (Department) {
            groupStage = {
                _id: "$Department", // Group by Department
                donorCount: { $sum: 1 }
            };
        } else if (!collegeCode) {
            groupStage = {
                _id: "$collegeCode", // Group by collegeCode
                donorCount: { $sum: 1 }
            };
        } else {
            groupStage = {
                _id: "$Department", // Group by Department when filtering by collegeCode
                donorCount: { $sum: 1 }
            };
        }

        aggregationPipeline.push({ $group: groupStage });

        const studentCount = await StudentSchema.aggregate(aggregationPipeline);
        const staffCount = await StaffSchema.aggregate(aggregationPipeline);

        const mergedCounts = {};
        const addCounts = (counts) => {
            counts.forEach(({ _id, donorCount }) => {
                if (!mergedCounts[_id]) {
                    mergedCounts[_id] = 0;
                }
                mergedCounts[_id] += donorCount;
            });
        };

        addCounts(studentCount);
        addCounts(staffCount);

        const sortedMergedCounts = Object.keys(mergedCounts)
            .sort()
            .reduce((acc, key) => {
                acc[key] = mergedCounts[key];
                return acc;
            }, {});

        // Transform the data into the required format if EventDate is provided
        if (EventDate) {
            const formattedData = [
                {
                    scaleType: "band",
                    data: Object.keys(sortedMergedCounts) // Extract keys as data (x-axis labels)
                }
            ];

            const seriesData = Object.values(sortedMergedCounts); // Extract values (y-axis data)

            return res.status(200).json({
                xAxis: formattedData,
                series: [{ data: seriesData }]
            });
        }

        // Default response for other cases
        return res.status(200).json(sortedMergedCounts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
};


// --------------------------------------------------------------------------------------------------------------------------------


const GetCollegeCodeMapping = async (req, res) => {
    try {
        // Aggregation pipelines for both StudentSchema and StaffSchema
        const studentColleges = StudentSchema.aggregate([
            {
                $group: {
                    _id: "$collegeCode",
                    college: { $first: "$College" }
                }
            }
        ]);

        const staffColleges = StaffSchema.aggregate([
            {
                $group: {
                    _id: "$collegeCode",
                    college: { $first: "$College" }
                }
            }
        ]);

        // Execute both aggregations concurrently
        const [studentResults, staffResults] = await Promise.all([
            studentColleges,
            staffColleges
        ]);

        // Combine results from both schemas
        const combinedResults = [...studentResults, ...staffResults];

        // Reduce to a single mapping object to handle duplicates
        var result = combinedResults.reduce((acc, item) => {
            if (!acc[item._id]) {
                acc[item._id] = item.college;
            }
            return acc;
        }, {});

        result[""] = "All Colleges";
        console.log(result);

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};



// --------------------------------------------------------------------------------------------------------------------------------



const EventsDataHandler = async (req, res) => {
    try {
        const EventsData = await EventSchema.find().sort({ Date: -1 }); // Sorts by date in descending order

        return res.status(200).json(EventsData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};


// --------------------------------------------------------------------------------------------------------------------------------


const GalleryDataHandler = async (req, res) => {
    try {
        const GallerysData = await GallerySchema.find();

        return res.status(200).json(GallerysData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// --------------------------------------------------------------------------------------------------------------------------------

const GenderCountHandler = async (req, res) => {
  try {
        const {College, EventDate} = req.query;

        const toDate = new Date();
        toDate.setUTCHours(23, 59, 59, 999);
        const fromDate = new Date();
        fromDate.setUTCHours(0, 0, 0, 0);


        const matchStage = {};
        if (College) {
            matchStage.College = College;
        }
        else if (EventDate) {
            matchStage.EventDate =  { $gte: fromDate, $lt: toDate };
        }




        const aggregationPipeline = [];
        if (Object.keys(matchStage).length > 0) {
            aggregationPipeline.push({ $match: matchStage });
        }
        aggregationPipeline.push({
            $group: {
                _id: "$Gender",
                donorCount: { $sum: 1 }
            }
        });

      const studentCount = await StudentSchema.aggregate(aggregationPipeline);
      const staffCount = await StaffSchema.aggregate(aggregationPipeline);
      const managementCount = await managementandguest.aggregate(aggregationPipeline);

      const mergedCounts = {};
      const addCounts = (counts) => {
          counts.forEach(({ _id, donorCount }) => {
              if (!mergedCounts[_id]) {
                  mergedCounts[_id] = 0;
              }
              mergedCounts[_id] += donorCount;
          });
      };

      addCounts(studentCount);
      addCounts(staffCount);
      addCounts(managementCount);

      if (EventDate) {
        const data = Object.entries(mergedCounts).map(([gender, count], index) => ({
          id: index,
          value: count,
          label: `${gender}: ${count}`,
        }));
  
        return res.status(200).json({ data });
      }

      return res.status(200).json(mergedCounts);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server Error' });
  }
};


const LiveCountHandler = async (req, res) => {
    try {
        const { Venue } = req.query;

        // Define the start and end of the current day in UTC
        const toDate = new Date();
        toDate.setUTCHours(23, 59, 59, 999);
        const fromDate = new Date();
        fromDate.setUTCHours(0, 0, 0, 0);

        console.log("From Date:", fromDate, "To Date:", toDate);

        // Match stage for the aggregation
        const matchStage = {
            EventDate: { $gte: fromDate, $lt: toDate }, // Match for the entire day
        };

        if (Venue) {
            matchStage.Venue = Venue;
        }

        // Build the aggregation pipeline for students
        const studentAggregation = [
            { $match: matchStage },
            {
                $group: {
                    _id: "$Department", // Group by Department
                    donorCount: { $sum: 1 }, // Count the number of donors
                },
            },
        ];

        // Fetch counts for students
        const studentCount = await StudentSchema.aggregate(studentAggregation);
        console.log("Student Count:", studentCount);

        // Merge the counts
        const mergedCounts = {};
        studentCount.forEach(({ _id, donorCount }) => {
            mergedCounts[_id] = donorCount || 0;
        });

        // Fetch registered data for the same event date
        const registeredAggregation = [
            { $match: { EventDate: { $gte: fromDate, $lt: toDate } } },
            {
                $group: {
                    _id: "$branch", // Group by branch
                    count: { $sum: 1 }, // Count the registered students
                },
            },
        ];

        const registeredData = await RegisterSchema.aggregate(registeredAggregation);
        console.log("Register Count:", registeredData);

        // Map registered data for quick access
        const registeredMap = {};
        registeredData.forEach(({ _id, count }) => {
            registeredMap[_id] = count || 0;
        });

        // Combine all department data
        const allDepartments = [...new Set([...Object.keys(mergedCounts), ...Object.keys(registeredMap)])];

        // Prepare final response data
        const uData = [];
        const pData = [];
        const xLabels = [];

        allDepartments.forEach((department) => {
            uData.push(mergedCounts[department] || 0); // Donor count
            pData.push(registeredMap[department] || 0); // Registered count
            xLabels.push(department); // Department name
        });

        // Return the response
        return res.status(200).json({ uData, pData, xLabels });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};






// --------------------------------------------------------------------------------------------------------------------------------



// It gives 
// No.of donors
// No. staff, students, Other

// UnitsCollected, NumberOfDonors, NumberOfBloodCamps

const OverviewCountsHandler = async (req, res) => {
    try {
        const studentsCount = await StudentSchema.distinct('_id').countDocuments();
        const staffCount = await StaffSchema.distinct('_id').countDocuments();
        const guestCount = await managementandguest.distinct('_id').countDocuments();
        const registeredCount = await RegisterSchema.distinct('_id').countDocuments();


        const totalStudentCount = await StudentSchema.countDocuments();
        const totalStaffCount = await StaffSchema.countDocuments();
        const totalGuestCount = await managementandguest.countDocuments();

        const NumberOfDonors = studentsCount + staffCount + guestCount;
        const UnitsCollected = totalStudentCount + totalStaffCount + totalGuestCount;


        const studentEventDates = await StudentSchema.distinct('Venue');
        const staffEventDates = await StaffSchema.distinct('Venue');
        const managementEventDates = await managementandguest.distinct('Venue');

        const allEventDates = new Set([...studentEventDates, ...staffEventDates, ...managementEventDates]);
        const NumberOfBloodCamps = allEventDates.size;

        
        const NumberOfVolunteers = await VolunteerSchema.countDocuments();

        const result = {
            "StudentsCount": studentsCount,
            "StaffCount": staffCount,
            "GuestCount": guestCount,
            "NumberOfDonors": NumberOfDonors,
            "UnitsCollected": UnitsCollected,
            "NumberOfBloodCamps": NumberOfBloodCamps,
            "NumberOfVolunteers": NumberOfVolunteers,
            "RegisteredCount": registeredCount
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(404).json({ message: 'Server Error' });
    }
};

// --------------------------------------------------------------------------------------------------------------------------------

const VolunteersDataHandler = async (req, res) => {
    try {
        const VolunteersData = await VolunteerSchema.find();

        return res.status(200).json(VolunteersData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};


// --------------------------------------------------------------------------------------------------------------------------------


const RegisteredDataHandler = async (req, res) => {
    try {
        const RegisteredData = await RegisterSchema.find();

        console.log(RegisteredData);
        return res.status(200).json(RegisteredData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};



const GetDonatedData = async (req, res) => {
    try {
        const { eventDate } = req.query; // EventDate will be passed as a query parameter
        console.log(`Received EventDate: ${eventDate}`);

        if (!eventDate) {
            return res.status(400).json({ message: 'EventDate is required' });
        }

        // Parse EventDate to ensure proper format
        const parsedEventDate = new Date(eventDate);

        if (isNaN(parsedEventDate)) {
            return res.status(400).json({ message: 'Invalid EventDate format. Use YYYY-MM-DD or ISO format.' });
        }

        console.log(`Parsed EventDate: ${parsedEventDate}`);

        // Define start and end of the day to query a full day
        const startOfDay = new Date(parsedEventDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(parsedEventDate.setHours(23, 59, 59, 999));

        // Fetch data from all schemas based on the EventDate
        const staffData = await StaffSchema.find({
            EventDate: { $gte: startOfDay, $lt: endOfDay },
        }).select('Name MobileNumber College Department Venue Gender EmployeeId');

        const studentData = await StudentSchema.find({
            EventDate: { $gte: startOfDay, $lt: endOfDay },
        }).select('Name MobileNumber College Department Venue Gender Rollno');

        const managementAndGuestData = await managementandguest.find({
            EventDate: { $gte: startOfDay, $lt: endOfDay },
        }).select('Name TypeOfDonor MobileNumber Venue Gender');

        // Map data to a uniform structure
        const formattedStaffData = staffData.map((staff) => ({
            Name: staff.Name,
            Type: 'Staff',
            Id: staff.EmployeeId, // Use EmployeeId as Id
            MobileNumber: staff.MobileNumber,
            College: staff.College,
            Department: staff.Department,
            Venue: staff.Venue,
            Gender: staff.Gender,
        }));

        const formattedStudentData = studentData.map((student) => ({
            Name: student.Name,
            Type: 'Student',
            Id: student.Rollno, // Use Rollno as Id
            MobileNumber: student.MobileNumber,
            College: student.College,
            Department: student.Department,
            Venue: student.Venue,
            Gender: student.Gender,
        }));

        const formattedManagementAndGuestData = managementAndGuestData.map((mg) => ({
            Name: mg.Name,
            Type: mg.TypeOfDonor, // Use TypeOfDonor as Type
            Id: null, // No unique identifier for M&G
            MobileNumber: mg.MobileNumber,
            College: null, // No college field in M&G schema
            Department: null, // No department field in M&G schema
            Venue: mg.Venue,
            Gender: mg.Gender,
        }));

        // Combine all data into a single array
        const allData = [...formattedStaffData, ...formattedStudentData, ...formattedManagementAndGuestData];

        console.log(`Total records found: ${allData.length}`);
        res.status(200).json(allData);
    } catch (error) {
        console.error('Error fetching donated data:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};



// --------------------------------------------------------------------------------------------------------------------------------


// const DonorDataHandler = async (req, res) => {
//     try {
//         const RegisteredData = await RegisterSchema.find();

//         return res.status(200).json(RegisteredData);
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Server Error' });
//     }
// };



// --------------------------------------------------------------------------------------------------------------------------------


// const StudentDonors = async (req, res) => {
//     try {
//         const studentsData = StudentSchema.find();
//         return res.status(200).json(studentsData);
//     }

//     catch (error) {
//         console.log(error);
//         return res.status(500).json({message: "Error occcurred..."});
//     }
// }


// --------------------------------------------------------------------------------------------------------------------------------


// const StaffDonors = async (req, res) => {
//     try {
//         const staffData = StaffSchema.find();
//         return res.status(200).json(staffData);
//     }

//     catch (error) {
//         console.log(error);
//         return res.status(500).json({message: "Error occcurred..."});
//     }
// }


// --------------------------------------------------------------------------------------------------------------------------------



const registeredStudent = async (req, res) => {
    const { RollNumber } = req.body;

    try {
        // Check if the student exists and update the `donated` field to true
        const student = await RegisterSchema.findOneAndUpdate(
            { RollNumber },
            { $set: { donated: true } },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: "Student not registered" });
        }

        else return res.status(200).json(student);
    } catch (error) {
        console.error("Error updating student:", error);
        return res.status(500).json({ message: "An error occurred while updating the student" });
    }
};


const student = async (req, res) => {
    const  RollNumber  = req.body.RollNumber;
    const mobilenumber = req.body.PhoneNumber;


    if (!RollNumber) {
        return res.status(400).json({ message: "RollNumber is required" });
    }

    try {
        // Check for student in the local database
        const student = await RegisterSchema.findOne({ RollNumber });
        if (student) {
            console.log("Student found locally:", student);
            return res.status(200).json(student);
        } else {
            // Fetch student details from external API if not found locally
            const response = await axios.post(
                "https://adityauniversity.in/latecomersbackendapi/get-Studentss",
                { roll: RollNumber }
            );

            // Ensure external API response contains data
            if (response.data && response.data[0]) {
                const apiData = response.data[0];

                // Map API data to your schema
                const formattedData = {
                    Name: apiData.studentName,
                    Rollno: apiData.studentRoll,
                    MobileNumber: mobilenumber || apiData.studentMobile || "Not Available",
                    Email: apiData.email || "Not Available",
                    College: apiData.college || "Not Available",
                    Department: apiData.branch || "Not Available",
                    Gender: apiData.gender,
                    Year: apiData.passedOutYear
                };

                console.log("Formatted Data:", formattedData);

                return res.status(200).json(formattedData);
            } else {
                return res.status(404).json({ message: "Student not found in external API" });
            }
        }
    } catch (error) {
        console.error("Error retrieving student:", error.message);
        return res.status(500).json({ message: "An error occurred while fetching student details", error });
    }
};





// --------------------------------------------------------------------------------------------------------------------------------

const getUpcomingEvent = async (req, res) => {
    try {
      // Normalize currentDate to midnight (UTC)
      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);
  
      console.log('Normalized Current Date:', currentDate);
  
      const upcomingEvent = await EventSchema.find({
        Date: { $gte: currentDate },
      })
        .sort({ Date: 1 })
        .limit(1);
  
      console.log('Upcoming Event:', upcomingEvent);
  
      if (!upcomingEvent || upcomingEvent.length === 0) {
        return res.status(404).json({ message: 'No upcoming events found.' });
      }
  
      res.status(200).json(upcomingEvent[0]);
    } catch (error) {
      console.error('Error fetching upcoming event:', error);
      res.status(500).json({ message: 'An error occurred while fetching the upcoming event.' });
    }
  };
  



// --------------------------------------------------------------------------------------------------------------------------------

const getVenues = async (req, res) => {
    try {
        const date  = req.body.date;

        console.log(date);

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const event = await EventSchema.findOne({ Date: date });

        if (!event) {
            return res.status(404).json({ message: "No events found for the specified date" });
        }

        
        console.log(event.Colleges)
        res.status(200).json(event.Colleges);
    } catch (error) {
        console.error("Error in getVenues:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// --------------------------------------------------------------------------------------------------------------------------------

const VenueCountHandler = async (req, res) => {
    try {
      const { collegeCode, EventDate } = req.query;
      const toDate = new Date();
      toDate.setUTCHours(23, 59, 59, 999);
      const fromDate = new Date();
      fromDate.setUTCHours(0, 0, 0, 0);
  
      const matchStage = {};
      if (collegeCode) {
        matchStage.collegeCode = collegeCode;
      } else if (EventDate) {
        matchStage.EventDate = { $gte: fromDate, $lt: toDate };
      }
  
      const aggregationPipeline = [];
      if (Object.keys(matchStage).length > 0) {
        aggregationPipeline.push({ $match: matchStage });
      }
  
      let groupStage;
      if (!collegeCode) {
        groupStage = {
          _id: "$Venue", // Group by collegeCode
          donorCount: { $sum: 1 },
        };
      } else {
        groupStage = {
          _id: "$Venue", // Group by Department when filtering by collegeCode
          donorCount: { $sum: 1 },
        };
      }
  
      aggregationPipeline.push({ $group: groupStage });
  
      const studentCount = await StudentSchema.aggregate(aggregationPipeline);
      const staffCount = await StaffSchema.aggregate(aggregationPipeline);
  
      const mergedCounts = {};
      const addCounts = (counts) => {
        counts.forEach(({ _id, donorCount }) => {
          if (!mergedCounts[_id]) {
            mergedCounts[_id] = 0;
          }
          mergedCounts[_id] += donorCount;
        });
      };
  
      addCounts(studentCount);
      addCounts(staffCount);
  
      const sortedMergedCounts = Object.keys(mergedCounts)
        .sort()
        .reduce((acc, key) => {
          acc[key] = mergedCounts[key];
          return acc;
        }, {});
  
      console.log(sortedMergedCounts);
      return res.status(200).json(sortedMergedCounts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server Error" });
    }
  };




module.exports =   {
    BloodGroupHandler,
    DonorCountHandler,
    EventsDataHandler,

    GalleryDataHandler,
    GenderCountHandler,
    LiveCountHandler,
    OverviewCountsHandler,
    VolunteersDataHandler,
    RegisteredDataHandler,
    registeredStudent,
    student,
    getUpcomingEvent,
    getVenues,
    GetCollegeCodeMapping,
    GetDonatedData,
    VenueCountHandler,

    // RegisteredPeople,
    // StaffDonors,
    // StudentDonors,
}
