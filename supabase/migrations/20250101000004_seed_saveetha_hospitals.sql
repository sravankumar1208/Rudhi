insert into hospitals (name, address, phone, location, type) values
  (
    'Saveetha Medical College Hospital',
    'Saveetha Medical College Hospital, Thandalam, Chennai, Tamil Nadu 602105',
    '044-26272080',
    ST_SetSRID(ST_MakePoint(80.2130, 13.1568), 4326)::geography,
    'Hospital'
  ),
  (
    'Saveetha Dental Hospital',
    'Saveetha Dental College and Hospital, Velapadi, Nungambakkam, Chennai, Tamil Nadu 600029',
    '044-28362412',
    ST_SetSRID(ST_MakePoint(80.2457, 13.0588), 4326)::geography,
    'Dental Hospital'
  );
