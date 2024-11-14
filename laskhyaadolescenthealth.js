1. User Management:
userManagement.jsw

This file handles user registration, login, and logout functionality with JWT authentication.

import wixUsers from 'wix-users';
import wixSecretsBackend from 'wix-secrets-backend';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Secret key for JWT (store this securely)
const JWT_SECRET_KEY = "your-secret-key";

// Register a new user (adolescent or guardian)
export async function registerUser(userData) {
    try {
        const { email, password, role } = userData;

        // Check if user already exists
        const existingUser = await wixUsers.queryUsers().eq("email", email).find();
        if (existingUser.totalCount > 0) {
            return { status: 400, message: 'User already exists' };
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user in Wix database
        await wixUsers.createUser({ email, password: hashedPassword });

        return { status: 201, message: 'User created successfully' };
    } catch (error) {
        return { status: 500, message: 'Error during registration' };
    }
}

// Login a user and return a JWT token
export async function loginUser(email, password) {
    try {
        const user = await wixUsers.queryUsers().eq("email", email).find();
        if (user.totalCount === 0) {
            return { status: 404, message: 'User not found' };
        }

        const dbUser = user.items[0];
        const validPassword = await bcrypt.compare(password, dbUser.password);

        if (!validPassword) {
            return { status: 401, message: 'Invalid credentials' };
        }

        // Generate JWT token
        const token = jwt.sign({ userId: dbUser._id, role: dbUser.role }, JWT_SECRET_KEY, { expiresIn: '1h' });

        return { status: 200, token };
    } catch (error) {
        return { status: 500, message: 'Error during login' };
    }
}

// Logout user and invalidate session
export async function logoutUser() {
    try {
        wixUsers.logout();
        return { status: 200, message: 'Logged out successfully' };
    } catch (error) {
        return { status: 500, message: 'Error during logout' };
    }
}

2. Health Dashboard:
healthDashboard.jsw

This file handles fetching and updating the health metrics for users, such as sleep, exercise, and water intake.

import wixData from 'wix-data';

// Get the user's health data
export async function getHealthMetrics(userId) {
    try {
        const result = await wixData.query('HealthMetrics').eq('userId', userId).find();
        if (result.totalCount === 0) {
            return { status: 404, message: 'No health data found' };
        }
        return { status: 200, healthMetrics: result.items[0] };
    } catch (error) {
        return { status: 500, message: 'Error fetching health metrics' };
    }
}

// Update the user's health data
export async function updateHealthMetrics(userId, metrics) {
    try {
        const existingMetrics = await wixData.query('HealthMetrics').eq('userId', userId).find();
        if (existingMetrics.totalCount > 0) {
            // Update existing data
            const updated = await wixData.update('HealthMetrics', { ...existingMetrics.items[0], ...metrics });
            return { status: 200, updatedMetrics: updated };
        } else {
            // Create new entry if no data exists
            const created = await wixData.insert('HealthMetrics', { userId, ...metrics });
            return { status: 200, newMetrics: created };
        }
    } catch (error) {
        return { status: 500, message: 'Error updating health data' };
    }
}

3. Symptom Checker:
symptomChecker.jsw

This file processes a user's symptoms and provides recommendations or next steps based on predefined data.

// List of predefined symptoms and recommendations (example data)
const symptomRecommendations = {
    fever: "If you have a fever, drink plenty of fluids and rest. If it persists, consider seeing a doctor.",
    headache: "Try drinking water and resting. If the headache continues, you may need medical advice.",
};

// Submit symptoms and return recommendations
export async function submitSymptoms(symptoms) {
    try {
        const recommendations = symptoms.map(symptom => symptomRecommendations[symptom] || "Consult a healthcare provider.");
        return { status: 200, recommendations };
    } catch (error) {
        return { status: 500, message: 'Error processing symptoms' };
    }
}

4. Mental Health Support:
mentalHealth.jsw

This file handles fetching mental health resources, conducting a self-assessment, and booking counseling sessions.

import wixData from 'wix-data';

// Get mental health resources (e.g., articles, tips, videos)
export async function getMentalHealthResources() {
    try {
        const resources = await wixData.query('MentalHealthResources').find();
        return { status: 200, resources: resources.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching mental health resources' };
    }
}

// Submit self-assessment responses for mental health
export async function submitSelfAssessment(assessmentData) {
    try {
        await wixData.insert('MentalHealthAssessments', assessmentData);
        return { status: 200, message: 'Self-assessment submitted successfully' };
    } catch (error) {
        return { status: 500, message: 'Error submitting self-assessment' };
    }
}

// Book a session with a therapist
export async function bookSession(sessionData) {
    try {
        const bookedSession = await wixData.insert('TherapistSessions', sessionData);
        return { status: 200, session: bookedSession };
    } catch (error) {
        return { status: 500, message: 'Error booking session' };
    }
}

5. Appointment Management:
appointments.jsw

This file handles booking and retrieving appointment data, including reminders for upcoming appointments.

import wixData from 'wix-data';

// Book an appointment with a healthcare provider
export async function bookAppointment(appointmentDetails) {
    try {
        const newAppointment = await wixData.insert('Appointments', appointmentDetails);
        return { status: 200, message: 'Appointment booked successfully', appointment: newAppointment };
    } catch (error) {
        return { status: 500, message: 'Error booking appointment' };
    }
}

// Get upcoming appointments and reminders
export async function getAppointmentReminders(userId) {
    try {
        const reminders = await wixData.query('Appointments')
            .eq('userId', userId)
            .and(wixData.query('Appointments').gt('appointmentDate', new Date()))
            .find();

        return { status: 200, reminders: reminders.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching appointment reminders' };
    }
}

6. Nutrition and Fitness:
nutritionAndFitness.jsw

This file handles fetching personalized nutrition plans and logging fitness activities.

// Provide a personalized nutrition plan
export async function getNutritionPlan(userId) {
    try {
        const plan = {
            breakfast: "Oatmeal with fruits and nuts",
            lunch: "Chicken salad with quinoa",
            dinner: "Grilled salmon with vegetables"
        };
        return { status: 200, nutritionPlan: plan };
    } catch (error) {
        return { status: 500, message: 'Error fetching nutrition plan' };
    }
}

// Log daily fitness activities
export async function logFitnessActivity(userId, fitnessData) {
    try {
        const loggedActivity = await wixData.insert('FitnessActivities', { userId, ...fitnessData });
        return { status: 200, loggedActivity };
    } catch (error) {
        return { status: 500, message: 'Error logging fitness activity' };
    }
}

7. Guardian Access:
guardianAccess.jsw

This file manages guardian access requests for viewing adolescent health data.

import wixData from 'wix-data';

// Request guardian access
export async function requestGuardianAccess(adolescentId, guardianId) {
    try {
        // Ensure that the adolescent consents to the access request
        const adolescentData = await wixData.query('Adolescents').eq('userId', adolescentId).find();
        if (adolescentData.totalCount === 0 || adolescentData.items[0].guardianId !== guardianId) {
            return { status: 403, message: 'Access denied: No consent from adolescent' };
        }

        // Store the access request in database
        await wixData.insert('GuardianAccessRequests', { adolescentId, guardianId });
        return { status: 200, message: 'Access granted' };
    } catch (error) {
        return { status: 500, message: 'Error processing guardian access' };
    }
}
1. Page Code - API Setup:

First, we set up a base structure that will allow us to use backend APIs for all the main pages.
pageCode.jsw (General setup for interacting with Wix data):

// Import necessary Wix modules
import wixData from 'wix-data';
import wixUsers from 'wix-users';

// Function to handle fetching page data
export async function fetchPageData(pageId) {
    try {
        const page = await wixData.query("Pages").eq("pageId", pageId).find();
        if (page.totalCount === 0) {
            return { status: 404, message: 'Page not found' };
        }
        return { status: 200, page: page.items[0] };
    } catch (error) {
        return { status: 500, message: 'Error fetching page data' };
    }
}

2. Main Pages:
Home (Main landing page API)
homePage.jsw

import wixData from 'wix-data';

// Fetch main homepage content
export async function fetchHomePageContent() {
    try {
        const homePageContent = await wixData.query('HomePageContent').find();
        return { status: 200, content: homePageContent.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching homepage content' };
    }
}

Search Results API
searchResults.jsw

import wixData from 'wix-data';

// Fetch search results based on a query
export async function getSearchResults(query) {
    try {
        const results = await wixData.query('HealthData')
            .contains('title', query)
            .or(wixData.query('HealthData').contains('description', query))
            .find();
        return { status: 200, results: results.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching search results' };
    }
}

Master Page Code (Common layout)
masterPage.js

import wixUsers from 'wix-users';

// Check if user is logged in and return user data
export async function checkUserLogin() {
    try {
        const currentUser = wixUsers.currentUser;
        if (currentUser.loggedIn) {
            const userDetails = await currentUser.getEmail();
            return { status: 200, user: userDetails };
        } else {
            return { status: 401, message: 'User not logged in' };
        }
    } catch (error) {
        return { status: 500, message: 'Error checking user login' };
    }
}

3. Bookings Pages:
Book Online (API for booking an appointment)
bookOnline.jsw

import wixData from 'wix-data';

// Book an appointment
export async function bookAppointment(appointmentDetails) {
    try {
        const appointment = await wixData.insert('Appointments', appointmentDetails);
        return { status: 200, message: 'Appointment booked successfully', appointment };
    } catch (error) {
        return { status: 500, message: 'Error booking appointment' };
    }
}

Side Cart API (Add items to cart)
sideCart.jsw

import wixData from 'wix-data';

// Add service to the cart
export async function addToCart(userId, serviceDetails) {
    try {
        const cartItem = await wixData.insert('CartItems', { userId, ...serviceDetails });
        return { status: 200, message: 'Service added to cart', cartItem };
    } catch (error) {
        return { status: 500, message: 'Error adding service to cart' };
    }
}

Service Page API (Retrieve service details)
servicePage.jsw

import wixData from 'wix-data';

// Fetch service details for a specific service page
export async function fetchServiceDetails(serviceId) {
    try {
        const service = await wixData.query('Services').eq('serviceId', serviceId).find();
        if (service.totalCount === 0) {
            return { status: 404, message: 'Service not found' };
        }
        return { status: 200, service: service.items[0] };
    } catch (error) {
        return { status: 500, message: 'Error fetching service details' };
    }
}

Booking Calendar (Fetch available booking slots)
bookingCalendar.jsw

import wixData from 'wix-data';

// Fetch available booking slots
export async function fetchAvailableSlots(date) {
    try {
        const slots = await wixData.query('BookingSlots').eq('date', date).find();
        return { status: 200, slots: slots.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching booking slots' };
    }
}

Booking Form (Submit booking form)
bookingForm.jsw

import wixData from 'wix-data';

// Submit booking details
export async function submitBookingForm(formData) {
    try {
        const booking = await wixData.insert('Bookings', formData);
        return { status: 200, message: 'Booking confirmed', booking };
    } catch (error) {
        return { status: 500, message: 'Error submitting booking form' };
    }
}

Cart Page API (Fetch cart items)
cartPage.jsw

import wixData from 'wix-data';

// Fetch user's cart items
export async function getCartItems(userId) {
    try {
        const cartItems = await wixData.query('CartItems').eq('userId', userId).find();
        return { status: 200, items: cartItems.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching cart items' };
    }
}

Thank You Page API (Handle post-purchase actions)
thankYouPage.jsw

import wixData from 'wix-data';

// Save thank you page data (e.g., post-purchase feedback)
export async function saveThankYouPageData(feedbackData) {
    try {
        const feedback = await wixData.insert('ThankYouPageFeedback', feedbackData);
        return { status: 200, message: 'Feedback saved successfully', feedback };
    } catch (error) {
        return { status: 500, message: 'Error saving feedback' };
    }
}

4. Program Pages:
Health Metrics Programs (Visitor Page)
visitorPage.jsw

import wixData from 'wix-data';

// Fetch visitor-specific health program content
export async function getVisitorProgramData() {
    try {
        const programs = await wixData.query('HealthPrograms').eq('type', 'visitor').find();
        return { status: 200, programs: programs.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching visitor programs' };
    }
}

Health Metrics Programs (Participant Page)
participantPage.jsw

import wixData from 'wix-data';

// Fetch participant-specific health program content
export async function getParticipantProgramData() {
    try {
        const programs = await wixData.query('HealthPrograms').eq('type', 'participant').find();
        return { status: 200, programs: programs.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching participant programs' };
    }
}

Health Metrics Programs (Payment Page)
paymentPage.jsw

import wixPayments from 'wix-payments';

// Process payment for health programs
export async function processPayment(paymentData) {
    try {
        const payment = await wixPayments.createPayment(paymentData);
        return { status: 200, payment };
    } catch (error) {
        return { status: 500, message: 'Error processing payment' };
    }
}

5. Blog Pages:
Blog
blog.jsw

import wixData from 'wix-data';

// Fetch blog posts
export async function fetchBlogPosts() {
    try {
        const blogPosts = await wixData.query('BlogPosts').find();
        return { status: 200, posts: blogPosts.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching blog posts' };
    }
}

PostBlog (Fetch blog post details)
postBlog.jsw

import wixData from 'wix-data';

// Fetch details of a single blog post
export async function fetchBlogPost(postId) {
    try {
        const post = await wixData.query('BlogPosts').eq('postId', postId).find();
        if (post.totalCount === 0) {
            return { status: 404, message: 'Post not found' };
        }
        return { status: 200, post: post.items[0] };
    } catch (error) {
        return { status: 500, message: 'Error fetching blog post' };
    }
}

6. Members Area:
Profile
profile.jsw

import wixUsers from 'wix-users';

// Fetch the logged-in user's profile
export async function fetchUserProfile() {
    try {
        const currentUser = wixUsers.currentUser;
        const userProfile = await currentUser.getEmail();
        return { status: 200, profile: userProfile };
    } catch (error) {
        return { status: 500, message: 'Error fetching user profile' };
    }
}

My Bookings
myBookings.jsw

import wixData from 'wix-data';

// Fetch user's bookings
export async function getUserBookings(userId) {
    try {
        const bookings = await wixData.query('Bookings').eq('userId', userId).find();
        return { status: 200, bookings: bookings.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching bookings' };
    }
}

My Programs
myPrograms.jsw

import wixData from 'wix-data';

// Fetch user's enrolled programs
export async function getUserPrograms(userId) {
    try {
        const programs = await wixData.query('HealthPrograms').eq('userId', userId).find();
        return { status: 200, programs: programs.items };
    } catch (error) {
        return { status: 500, message: 'Error fetching programs' };
    }
}

Account Settings
accountSettings.jsw

import wixUsers from 'wix-users';

// Update user account settings
export async function updateUserSettings(userId, settings) {
    try {
        const updatedUser = await wixUsers.updateUser(userId, settings);
        return { status: 200, message: 'Account settings updated', updatedUser };
    } catch (error) {
        return { status: 500, message: 'Error updating account settings' };
    }
}
