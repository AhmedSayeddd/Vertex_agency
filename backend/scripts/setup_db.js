require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Neon Postgres.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100),
        job_title VARCHAR(150),
        salary_package VARCHAR(200),
        location VARCHAR(100),
        work_type VARCHAR(20),
        shift_hours VARCHAR(100),
        english_level VARCHAR(20),
        experience_required VARCHAR(50),
        nationality VARCHAR(50),
        gender VARCHAR(20),
        employment_type VARCHAR(20),
        graduation_status VARCHAR(50),
        max_age INT,
        status VARCHAR(10) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150),
        age INT,
        nationality VARCHAR(50),
        gender VARCHAR(20),
        city VARCHAR(100),
        work_preference VARCHAR(20),
        english_level VARCHAR(20),
        experience VARCHAR(50),
        shift_preference VARCHAR(50),
        employment_type VARCHAR(20),
        graduation_status VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(150),
        cover_message TEXT,
        selected_offer_id INT,
        application_type VARCHAR(20) DEFAULT 'ai-matched',
        status VARCHAR(20) DEFAULT 'new',
        submitted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Tables ready.');

    const existing = await client.query(`SELECT id FROM admins WHERE username = 'admin'`);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('vertex2025', 10);
      await client.query(`INSERT INTO admins (username, password_hash) VALUES ('admin', $1)`, [hash]);
      console.log('Default admin created — username: admin | password: vertex2025');
    }

    const offersCount = await client.query(`SELECT COUNT(*) FROM offers`);
    if (parseInt(offersCount.rows[0].count) === 0) {
      const offers = [
        ['Assets', 'Appointment Setter FT', '15K + 6K commission + 2K transport', 'Nasr City', 'on-site', '4pm-5am', 'B2+', 'none', 'egyptians-only', 'all', 'full-time', 'all', null],
        ['Assets', 'B2B Morning Shift', '17K + 3K KPI up to 40K', 'Nasr City', 'on-site', '10:45am-8pm', 'B2+', 'none', 'all', 'all', 'full-time', 'all', null],
        ['Assets', 'Customer Support Back Office', '12K + commission', 'Nasr City', 'on-site', '4pm-5am', 'B2+', 'none', 'egyptians-only', 'females-only', 'full-time', 'all', null],
        ['TTC', 'Telesales US Account', '12K + unlimited commission + 1K KPI', 'Nasr City', 'on-site', '3pm-11pm', 'B2+', 'none', 'egyptians-only', 'all', 'full-time', 'all', 28],
        ['Aces', 'Telesales Medical US', '10K + 2K KPI + up to 15K commission', 'Abbasiya', 'on-site', '3:30pm-11:30pm', 'B2', 'none', 'egyptians-only', 'all', 'full-time', 'all', 26],
        ['Aces', 'Part-time Telesales', '7K + commission', 'Abbasiya', 'on-site', 'rotational', 'B2', 'none', 'egyptians-only', 'all', 'part-time', 'all', null],
        ['BIS', 'Telesales USA', '10K + up to 20K commission', 'Nasr City', 'on-site', '3pm-11pm', 'B2+', 'none', 'all', 'all', 'full-time', 'all', null],
        ['Cataleads', 'ISA Appointment Setter', '$3.5-$5/hr + uncapped bonus', 'Nasr City', 'on-site', '5pm-2am', 'C1', '6months+', 'all', 'all', 'full-time', 'all', 30],
        ['Cataleads', 'Real Estate Cold Caller', '$3/hr + bonuses', 'Nasr City', 'on-site', '5pm-2am', 'C1', '1year+', 'all', 'all', 'full-time', 'all', 30],
        ['Creative Basket', 'Travel Advisor Telesales', '$250-$400 + commission', 'Nasr City', 'on-site', '4pm-1am', 'B2+', '6months+', 'all', 'all', 'full-time', 'all', null],
        ['Nexuara', 'Cold-Calling Agent', '1K EGP per deal', 'Gisr El Suez', 'on-site', '4pm-12am', 'B2', 'none', 'all', 'all', 'full-time', 'all', null],
        ['Synergistic', 'Telesales Paid Internship', '16K + commission', 'Nasr City', 'on-site', '2am-10am', 'B2', 'none', 'all', 'all', 'full-time', 'all', 25],
        ['Symbios', 'BDR Business Development', 'up to 16.5K + USD commissions', 'Nasr City', 'on-site', '11:45pm-8am', 'C1', '1year+', 'all', 'all', 'full-time', 'grads-only', null],
        ['Geeky CX', 'Debt Settlement Negotiator', '15K + up to 10K bonus', 'Sheikh Zayed', 'on-site', '7pm-4am', 'C1', '1year+', 'all', 'all', 'full-time', 'grads-only', null],
        ['Leadbull', 'Telesales Canadian Account FT', '15K + 5K KPI + spiffs', 'Zahraa El Maadi', 'on-site', '4pm-1am', 'B2+', 'none', 'all', 'all', 'full-time', 'all', null],
        ['Leadbull', 'Telesales Canadian Account WFH', '15K + 5K KPI', 'WFH', 'wfh', '3pm-12am', 'B2+', 'none', 'all', 'all', 'full-time', 'all', null],
        ['REZ', 'Real Estate Cold Caller WFH', '$250 basic + $100 KPI', 'WFH', 'wfh', '9hr shift Mon-Fri', 'B2', '6months+', 'all', 'all', 'full-time', 'all', null],
        ['Outsourcing 4u', 'Telesales UK Agent', 'up to 16K + unlimited commission', 'Maadi', 'on-site', '11:30am-7:45pm', 'B2', 'none', 'all', 'all', 'full-time', 'all', null],
        ['Outsourcing 4u', 'HR Generalist', '10K', 'Maadi', 'on-site', '11:30am-7:45pm', 'B2+', '6months+', 'all', 'females-only', 'full-time', 'all', null],
        ['Outsourcing 4u', 'Social Media Specialist', '7.5K', 'Maadi', 'on-site', '12pm-8:15pm', 'B2', '3months+', 'all', 'all', 'full-time', 'all', null],
        ['Outsourcing 4u', 'HR Recruiter', '8K', 'Maadi', 'on-site', '12:15pm-8:30pm', 'B2+', '3months+', 'all', 'females-only', 'full-time', 'all', null],
        ['Winirix', 'Appointment Setter WFH', '15K + 2K KPI', 'WFH', 'wfh', '5pm-2am', 'B2', '6months+', 'all', 'all', 'full-time', 'all', null],
        ['Launch Pad', 'Sales Agent Travel', '12K + up to 10K commission', 'Sheikh Zayed', 'on-site', '3:30pm-12:30am', 'C1', 'none', 'egyptians-only', 'all', 'full-time', 'grads-only', 30],
        ['Dial Expert', 'Tax Sales Closer WFH', '15K + $10-$15 per deal', 'WFH', 'wfh', '6pm-3am', 'B2+', '6months+', 'all', 'all', 'full-time', 'all', null],
      ];

      for (const o of offers) {
        await client.query(`
          INSERT INTO offers (company_name, job_title, salary_package, location, work_type, shift_hours, english_level, experience_required, nationality, gender, employment_type, graduation_status, max_age)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        `, o);
      }
      console.log('Offers seeded.');
    }

    console.log('✅ Database setup complete!');
  } catch (err) {
    console.error('Setup error:', err);
  } finally {
    await client.end();
    process.exit();
  }
}

setupDatabase();