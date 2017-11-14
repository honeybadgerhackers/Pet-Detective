<img src="https://www.shareicon.net/data/512x512/2015/10/10/653854_print_512x512.png" width="30%" />

# Pet-Detective
The app that helps the hunt for lost pets!
## Team
### Copypasta

Product Owner: Tourne Torres
Scrum Master: Daniel Weill
Development Team Members: Tourne Torres, Taijon Robinson, Daniel Weill

## Some usage instructions
## Requirements
Node 6.10.2 \
MySQL 2.13.0 \
Deployed with DigitalOcean 

Place these keys in a file called map.config.js inside of your *client* folder
window.GEOCODE_API_KEY = 'YOUR GEOCODE API KEY';

window.PLACES_API_KEY = 'YOUR PLACES API KEY';

Create a .env file in your root directory to store port and database variables. Localhost will suffice for db in most cases

You will need a database called petdetective, created in a mysql session. Once used, create a table called petpost with the following command: 

`create table petpost (id integer not null auto_increment, lostOrFound varchar(20), type varchar(20) , styles varchar(200), address varchar(140), message varchar(140), date varchar(140), latlong varchar(140), user varchar(75), petPic varchar(220), primary key (id), userpic varchar(220));`

Create a users table with the following:

`create table users ( email varchar(75) NOT NULL UNIQUE, picture varchar(220), first_name varchar(25), last_name varchar(25));`

Exit mysql, and run the following command from your terminal. **This process will take some time.**:
`mysql -u root petdetective < docs/zipcodes.sql`

## Installing Dependencies

### From within the root directory:
Run this command:
`npm install`

It's that simple!
## Tasks
To start the app run: `npm start`

## Contributing

See CONTRIBUTING.md for contribution guidelines.

<img src="http://www.pngall.com/wp-content/uploads/2016/05/MySQL-Logo.png" width="20%"><img src="https://i1.wp.com/www.helloworldforbeginners.com/wp-content/uploads/2017/01/node-express.png?resize=365%2C201" width="20%"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-BLdbYkpNZFei4Ok3tusGUT6hl3sy-QEHWuWPAIugq4cEoq3e" width="20%"><img src="http://topdogsocialmedia.com/wp-content/uploads/2012/01/Google-Places-Listing.png" width="20%"><img src="https://www.digitalocean.com/assets/media/logos-badges/png/DO_Logo_Vertical_Blue-6321464d.png" width="20%"><img src="https://cloudinary-res.cloudinary.com/image/upload/c_scale,fl_attachment,w_500/v1/logo/for_white_bg/cloudinary_vertical_logo_for_white_bg.png" width="20%">
