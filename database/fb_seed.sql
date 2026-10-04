-- Demo Project Seed Data
INSERT INTO fb_projects (id, name) VALUES ('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 'Demo Project 2025');

-- Assign National Director and Accountant to this project
INSERT INTO fb_project_users (project_id, username, role_scope) VALUES ('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 'nd_national', 'national_director');
INSERT INTO fb_project_users (project_id, username, role_scope) VALUES ('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 'fd_national', 'accountant');
INSERT INTO fb_project_users (project_id, username, role_scope) VALUES ('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 'admin', 'admin');

-- Houses
INSERT INTO fb_houses (id, project_id, house_no, mother_username) VALUES ('h1111111-1111-1111-1111-111111111111', 'd9b2d63d-4c3a-4f51-b01f-0e104e76c123', '1', 'mother1');

-- Default Rates for Jan 2025
INSERT INTO fb_rate_variables (project_id, year, month, variable_key, value) VALUES
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'food_o12_rate', 15000),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'food_u12_rate', 10000),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'clothing_o12_rate', 2500),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'clothing_u12_rate', 2000),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'household_rate', 5000),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'mother_food_rate', 18000),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'first_pct', 61.6667),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'second_pct', 33.3333),
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'savings_pct', 5.0000);

-- Data Entry for House 1
INSERT INTO fb_child_counts (project_id, year, month, house_id, food_o12, food_u12, clothing_o12, clothing_u12, household, mother_count) VALUES
('d9b2d63d-4c3a-4f51-b01f-0e104e76c123', 2025, 1, 'h1111111-1111-1111-1111-111111111111', 1, 1, 1, 1, 1, 1);
