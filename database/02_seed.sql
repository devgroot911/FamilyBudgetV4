-- Family Budget V4: Seed Data (Tables Must Be Empty)

-- 1. Insert National Level Users
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('nd', '1234/', 'national_director', 'National Director', 'ALL', '', 'National Director', '', ''),
('dnd', '1234/', 'national_director', 'Deputy National Director', 'ALL', '', 'Deputy National Director', '', ''),
('fd', '1234/', 'admin', 'Finance Director', 'ALL', '', 'Finance Director', '', ''),
('afd', '1234/', 'accountant', 'Asst Finance Director', 'ALL', '', 'Asst Finance Director', '', ''),
('acc', '1234/', 'accountant', 'Accountant', 'ALL', '', 'Accountant', '', '');

-- == Piliyandala Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_pili', '1234/', 'village_director', 'Village Director', 'Piliyandala', '', 'Piliyandala Village Director', '', ''),
('aa_pili', '1234/', 'assistant', 'Accounts Assistant', 'Piliyandala', '', 'Piliyandala Accounts Assistant', '', ''),
('m1_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '1', 'Samanthi 90', '', ''),
('m2_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '2', 'Kumari 13', '', ''),
('m3_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '3', 'Deepika 61', '', ''),
('m4_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '4', 'Chandini 42', '', ''),
('m5_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '5', 'Nirosha 75', '', ''),
('m6_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '6', 'Renuka 5', '', ''),
('m7_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '7', 'Anusha 16', '', ''),
('m8_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '8', 'Roshani 18', '', ''),
('m9_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '9', 'Sunethra 41', '', ''),
('m10_pili', '1234/', 'mother', 'Mother / YCCW', 'Piliyandala', '10', 'Malini 76', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Piliyandala', 1, 'm1_pili'),
('Piliyandala', 2, 'm2_pili'),
('Piliyandala', 3, 'm3_pili'),
('Piliyandala', 4, 'm4_pili'),
('Piliyandala', 5, 'm5_pili'),
('Piliyandala', 6, 'm6_pili'),
('Piliyandala', 7, 'm7_pili'),
('Piliyandala', 8, 'm8_pili'),
('Piliyandala', 9, 'm9_pili'),
('Piliyandala', 10, 'm10_pili');


-- == Monaragala Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_mona', '1234/', 'village_director', 'Village Director', 'Monaragala', '', 'Monaragala Village Director', '', ''),
('aa_mona', '1234/', 'assistant', 'Accounts Assistant', 'Monaragala', '', 'Monaragala Accounts Assistant', '', ''),
('m1_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '1', 'Nelum 93', '', ''),
('m2_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '2', 'Chamari 32', '', ''),
('m3_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '3', 'Damayanthi 95', '', ''),
('m4_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '4', 'Geethani 71', '', ''),
('m5_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '5', 'Darshani 98', '', ''),
('m6_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '6', 'Ayesha 49', '', ''),
('m7_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '7', 'Chathurika 28', '', ''),
('m8_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '8', 'Tharanga 8', '', ''),
('m9_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '9', 'Nilmini 67', '', ''),
('m10_mona', '1234/', 'mother', 'Mother / YCCW', 'Monaragala', '10', 'Dilhani 38', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Monaragala', 1, 'm1_mona'),
('Monaragala', 2, 'm2_mona'),
('Monaragala', 3, 'm3_mona'),
('Monaragala', 4, 'm4_mona'),
('Monaragala', 5, 'm5_mona'),
('Monaragala', 6, 'm6_mona'),
('Monaragala', 7, 'm7_mona'),
('Monaragala', 8, 'm8_mona'),
('Monaragala', 9, 'm9_mona'),
('Monaragala', 10, 'm10_mona');


-- == Galle Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_galle', '1234/', 'village_director', 'Village Director', 'Galle', '', 'Galle Village Director', '', ''),
('aa_galle', '1234/', 'assistant', 'Accounts Assistant', 'Galle', '', 'Galle Accounts Assistant', '', ''),
('m1_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '1', 'Samanthi 44', '', ''),
('m2_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '2', 'Kumari 72', '', ''),
('m3_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '3', 'Deepika 56', '', ''),
('m4_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '4', 'Chandini 89', '', ''),
('m5_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '5', 'Nirosha 57', '', ''),
('m6_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '6', 'Renuka 50', '', ''),
('m7_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '7', 'Anusha 16', '', ''),
('m8_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '8', 'Roshani 87', '', ''),
('m9_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '9', 'Sunethra 16', '', ''),
('m10_galle', '1234/', 'mother', 'Mother / YCCW', 'Galle', '10', 'Malini 52', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Galle', 1, 'm1_galle'),
('Galle', 2, 'm2_galle'),
('Galle', 3, 'm3_galle'),
('Galle', 4, 'm4_galle'),
('Galle', 5, 'm5_galle'),
('Galle', 6, 'm6_galle'),
('Galle', 7, 'm7_galle'),
('Galle', 8, 'm8_galle'),
('Galle', 9, 'm9_galle'),
('Galle', 10, 'm10_galle');


-- == Kandy Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_kandy', '1234/', 'village_director', 'Village Director', 'Kandy', '', 'Kandy Village Director', '', ''),
('aa_kandy', '1234/', 'assistant', 'Accounts Assistant', 'Kandy', '', 'Kandy Accounts Assistant', '', ''),
('m1_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '1', 'Nelum 63', '', ''),
('m2_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '2', 'Chamari 27', '', ''),
('m3_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '3', 'Damayanthi 97', '', ''),
('m4_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '4', 'Geethani 66', '', ''),
('m5_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '5', 'Darshani 60', '', ''),
('m6_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '6', 'Ayesha 56', '', ''),
('m7_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '7', 'Chathurika 62', '', ''),
('m8_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '8', 'Tharanga 11', '', ''),
('m9_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '9', 'Nilmini 9', '', ''),
('m10_kandy', '1234/', 'mother', 'Mother / YCCW', 'Kandy', '10', 'Dilhani 93', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Kandy', 1, 'm1_kandy'),
('Kandy', 2, 'm2_kandy'),
('Kandy', 3, 'm3_kandy'),
('Kandy', 4, 'm4_kandy'),
('Kandy', 5, 'm5_kandy'),
('Kandy', 6, 'm6_kandy'),
('Kandy', 7, 'm7_kandy'),
('Kandy', 8, 'm8_kandy'),
('Kandy', 9, 'm9_kandy'),
('Kandy', 10, 'm10_kandy');


-- == Jaffna Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_jaff', '1234/', 'village_director', 'Village Director', 'Jaffna', '', 'Jaffna Village Director', '', ''),
('aa_jaff', '1234/', 'assistant', 'Accounts Assistant', 'Jaffna', '', 'Jaffna Accounts Assistant', '', ''),
('m1_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '1', 'Samanthi 65', '', ''),
('m2_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '2', 'Kumari 92', '', ''),
('m3_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '3', 'Deepika 40', '', ''),
('m4_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '4', 'Chandini 50', '', ''),
('m5_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '5', 'Nirosha 45', '', ''),
('m6_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '6', 'Renuka 99', '', ''),
('m7_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '7', 'Anusha 97', '', ''),
('m8_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '8', 'Roshani 12', '', ''),
('m9_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '9', 'Sunethra 36', '', ''),
('m10_jaff', '1234/', 'mother', 'Mother / YCCW', 'Jaffna', '10', 'Malini 10', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Jaffna', 1, 'm1_jaff'),
('Jaffna', 2, 'm2_jaff'),
('Jaffna', 3, 'm3_jaff'),
('Jaffna', 4, 'm4_jaff'),
('Jaffna', 5, 'm5_jaff'),
('Jaffna', 6, 'm6_jaff'),
('Jaffna', 7, 'm7_jaff'),
('Jaffna', 8, 'm8_jaff'),
('Jaffna', 9, 'm9_jaff'),
('Jaffna', 10, 'm10_jaff');


-- == Nuwara Eliya Village ==
INSERT INTO users (username, password, role, usertype, village, house, name, phone, email) VALUES
('vd_nuwa', '1234/', 'village_director', 'Village Director', 'Nuwara Eliya', '', 'Nuwara Eliya Village Director', '', ''),
('aa_nuwa', '1234/', 'assistant', 'Accounts Assistant', 'Nuwara Eliya', '', 'Nuwara Eliya Accounts Assistant', '', ''),
('m1_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '1', 'Nelum 38', '', ''),
('m2_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '2', 'Chamari 87', '', ''),
('m3_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '3', 'Damayanthi 4', '', ''),
('m4_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '4', 'Geethani 78', '', ''),
('m5_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '5', 'Darshani 58', '', ''),
('m6_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '6', 'Ayesha 93', '', ''),
('m7_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '7', 'Chathurika 28', '', ''),
('m8_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '8', 'Tharanga 19', '', ''),
('m9_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '9', 'Nilmini 87', '', ''),
('m10_nuwa', '1234/', 'mother', 'Mother / YCCW', 'Nuwara Eliya', '10', 'Dilhani 36', '', '');

INSERT INTO fb_houses (village, house_no, assigned_mother_username) VALUES
('Nuwara Eliya', 1, 'm1_nuwa'),
('Nuwara Eliya', 2, 'm2_nuwa'),
('Nuwara Eliya', 3, 'm3_nuwa'),
('Nuwara Eliya', 4, 'm4_nuwa'),
('Nuwara Eliya', 5, 'm5_nuwa'),
('Nuwara Eliya', 6, 'm6_nuwa'),
('Nuwara Eliya', 7, 'm7_nuwa'),
('Nuwara Eliya', 8, 'm8_nuwa'),
('Nuwara Eliya', 9, 'm9_nuwa'),
('Nuwara Eliya', 10, 'm10_nuwa');


