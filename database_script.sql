create database customersdb;
use customersdb;

-- people who manage the database have their own accounts.
create table accounts (
  id int auto_increment primary key,
  status varchar(255),
  username varchar(255),
  password varchar(255),
  email varchar(255),
  notify boolean
);

create table donationorganization (
  id int auto_increment primary key,
  name varchar(255),
  governmentid blob
);

create table donors (
  id int auto_increment primary key,
  firstname varchar(255),
  lastname varchar(255),
  email varchar(255),
  address varchar(255),
  preferredcontactmethod varchar(255),
  contactnotes varchar(255),
  frequency int,
  lastpaymentdate date, 
  lastpaymenttime time
);

create table donations (
  id int auto_increment primary key,
  paymentamount double,
  paymenttype varchar(255),
  paymentdate date, 
  paymenttime time,
  paymentmedthod varchar(255),
  paymentdetails varchar(510),
  creator int,
  donor int,
  foreign key (creator) references accounts(id),
  foreign key (donor) references donors(id)
);

-- insert an account by default. every user is an admin, btw. 
insert into accounts (id, username, password) values (1, 'user', 'user');

