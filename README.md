## student-tracker app
## https://student-tracker-three.vercel.app/ ##

Project Description

The Student Tracker is a web-based application that facilitates the tracking of school-aged children during their commutes to and from school via a school bus. The app is designed for use by three distinct user groups: Administrators, Employees, and Parents.

Administrators are responsible for managing the bus, employee, parent, and student data models, including creating, updating, and deleting records as necessary. Employees, who are assigned to specific buses, are responsible for managing bus sessions and tracking the attendance of students on the bus. Parents, in turn, have the ability to inform the app of their child's planned attendance for the next school day. By default, all students are marked as "coming" unless a parent indicates otherwise.

The application is structured in a logical manner to make it easy to use. First, Administrators must create a bus, as this is a prerequisite for creating employees and students. Next, Administrators create employees and assign them to specific buses. After creating employees, Administrators can then create parents, and subsequently, students. The parent's details page includes a button to add children, which assigns the child to a specific bus.

The application's functionality is dependent on the employee starting a bus session. If the session is not active, users are limited to performing CRUD operations on their profiles. Once the session is activated, students whose "isComing" property is marked as true and have the same assigned bus ID as the employee's, will appear on a list for the employee to track. The parents of these students will also be able to view their child's location on a map when the child is marked as present by the employee. Once the child disembarks from the bus, the employee will mark the child as absent, and the parent will no longer be able to view the child's location on the map.

Technologies and Libraries Used in Frontend

- React.js
- Axios and tanstack/react-query for data fetching and caching 
- Zustand for state management
- MapBox for showing the children current position on the map
- react-hot-toast for notifying the user
- react-transition-group for simple animations like side drawer opening and closing
- react-router-dom for handling different routes, and creating custom private and admin routes

Technologies and Libraries Used in Backend

- Node.js, Express.js for creating server-side of the application
- MongoDB and mongoose for Database and managing its operations
- Cloudinary for storing images in the Cloud and retrieve them whenever we need it
- Multer for handling file uploads
- Express-validator for validating the inputs coming to our routes
- Jsonwebtoken for authorization and authentication of application user
- Bcrypt for hashing the passwords
