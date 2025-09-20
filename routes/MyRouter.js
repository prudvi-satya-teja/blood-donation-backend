const express = require('express');
const router = express.Router();

const DonorHandler = require('../controllers/Insertion/DonorController');

const uploadImage = require('../controllers/Insertion/EventImages');

const uploadGalleryImage = require('../controllers/Insertion/GalleryImages');

const ContactHandler = require('../controllers/Insertion/Contact');
const VolunteerHandler = require('../controllers/Insertion/VolunteerController');

const FilterController = require('../controllers/FilterController');
const UpdationHandler = require('../controllers/UpdationController');



const otpController = require('../controllers/otpController');
const validateLogin = require('../controllers/loginController');


// Insertion
router.post("/register", DonorHandler.RegisterHandler);
router.post("/add-staff-data",DonorHandler.StaffHandler);
router.post("/add-student-data",DonorHandler.StudentHandler)
router.post("/add-management-guest-data",DonorHandler.ManagementAndGuestHandler);


router.post("/add-event", uploadImage.uploadImage);
router.post("/add-gallery-image", uploadGalleryImage.uploadGalleryImage);

router.post("/contact", ContactHandler.ContactHandler);
router.post("/add-volunteers-data",VolunteerHandler.VolunteerHandler);



// Filter routes
router.get('/count-by-blood-group', FilterController.BloodGroupHandler); // Blood
router.get('/count-by-gender', FilterController.GenderCountHandler);  // Gender Wise
router.get('/count-by-department', FilterController.DonorCountHandler); // College Wise
// router.get('/count-by-branch', FilterController.BranchCountHandler); // College Wise





router.get('/total-counts', FilterController.OverviewCountsHandler);
router.get('/volunteers-data', FilterController.VolunteersDataHandler);
router.get('/get-events', FilterController.EventsDataHandler);
router.get('/gallery-images', FilterController.GalleryDataHandler);
router.get('/live-counts', FilterController.LiveCountHandler);
router.get('/get-registered-data', FilterController.RegisteredDataHandler);
router.post('/get-registered-student', FilterController.registeredStudent);
router.post('/get-student', FilterController.student);
router.get('/get-upcoming-event', FilterController.getUpcomingEvent);
router.post('/get-venues', FilterController.getVenues);

router.get('/get-college-names', FilterController.GetCollegeCodeMapping);
router.get('/get-donated-data', FilterController.GetDonatedData);


//Updation routes
router.post('/delete-volunteer', UpdationHandler.DeleteVolunteerHandler);
router.post('/delete-event', UpdationHandler.DeleteEventHandler);
router.put('/update-volunteer', UpdationHandler.UpdateVolunteerHandler);
router.put('/update-event', UpdationHandler.UpdateEventHandler);
router.post('/delete-gallery-image', UpdationHandler.DeleteGalleryHandler);



router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);

router.post('/validate-login', validateLogin.validateLogin);
router.get("/get-venues-data", FilterController.VenueCountHandler);



module.exports = router;