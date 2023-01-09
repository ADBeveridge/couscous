use ebdb;

create table organizations (
  id int auto_increment primary key,
  name varchar(255),
  governmentId blob
);

-- people who manage the database have their own accounts.
create table accounts (
  id int auto_increment primary key,
  status varchar(255),
  username varchar(255),
  password varchar(255),
  email varchar(255),
  notify boolean,
  organization int,
  hidden boolean,
  foreign key (organization) references organizations (id),
  unique (username)
);

create table donors (
  id int auto_increment primary key,
  fname varchar(255),
  lname varchar(255),
  email varchar(255),
  phone varchar(255),
  address varchar(255),
  preferredContactMethod varchar(255),
  contactNotes varchar(255),
  frequency int,
  creator int,
  organization int,
  lastPaymentDateTime datetime,
  foreign key (creator) references accounts(id),
  foreign key (organization) references organizations (id)
);

create table donations (
  id int auto_increment primary key,
  paymentAmount double,
  paymentType varchar(255),
  paymentDateTime datetime,
  paymentMethod varchar(255),
  paymentDetails varchar(510),
  inputDateTime datetime, 
  creator int,
  donor int,
  foreign key (creator) references accounts(id),
  foreign key (donor) references donors(id)
);

-- insert owner account by default.
insert into accounts (username, password, status) values ('owner', 'owner', 'owner');

