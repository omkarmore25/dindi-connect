require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Group = require('./models/Group');
const Event = require('./models/Event');

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database. Dropping existing collections...');
    
    await User.deleteMany({});
    await Group.deleteMany({});
    await Event.deleteMany({});

    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user1 = await User.create({ email: 'leader1@example.com', password: hashedPassword, isVerified: true });
    const user2 = await User.create({ email: 'leader2@example.com', password: hashedPassword, isVerified: true });
    const user3 = await User.create({ email: 'leader3@example.com', password: hashedPassword, isVerified: true });

    console.log('Creating groups...');
    const group1 = await Group.create({
      groupName: 'Shree Ram Dindi Mandal',
      village: 'Pandharpur',
      leaderName: 'Tukaram Maharaj',
      contactNumber: '919876543210',
      memberCount: 25,
      acceptingBookings: true,
      description: "Shree Ram Dindi Mandal has been performing traditional Varkari kirtan and bhajans for over 15 years. We specialize in bringing the spiritual essence of Pandharpur to local festivals. Our 25 dedicated members practice weekly to ensure our performances authentic.",
      achievements: [
        "First Prize at the 2023 Maha Dindi Festival",
        "Over 50+ successful temple bookings last year",
        "Featured on regional Marathi News for cultural preservation"
      ],
      photos: [
        "https://images.unsplash.com/photo-1604085572504-a392ddf0f86a?w=800&q=80",
        "https://images.unsplash.com/photo-1596465495254-2c7bb2aa9617?w=800&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80"
      ],
      ownerId: user1._id
    });

    const group2 = await Group.create({
      groupName: 'Vithoba Krupa Dindi',
      village: 'Alandi',
      leaderName: 'Santosh Pawar',
      contactNumber: '919876543211',
      memberCount: 40,
      acceptingBookings: false,
      description: "Based in Alandi, the Vithoba Krupa Dindi is one of the largest and most well-respected groups in the state. With 40 members, our processions are grand affairs. We are currently fully booked for the season and taking a short rest before the next Ashadhi Ekadashi.",
      achievements: [
        "Participated in the Alandi to Pandharpur Waari for 20 consecutive years",
        "Recognized by the state cultural council"
      ],
      photos: [
        "https://images.unsplash.com/photo-1623847849666-da64feeb052b?w=800&q=80",
        "https://images.unsplash.com/photo-1520699049698-acd2f0285869?w=800&q=80"
      ],
      ownerId: user2._id
    });

    const group3 = await Group.create({
      groupName: 'Jai Hari Vithal Group',
      village: 'Dehu',
      leaderName: 'Ganesh Kadam',
      contactNumber: '919876543212',
      memberCount: 15,
      acceptingBookings: true,
      description: "A young and passionate group from Dehu. We are newer to the circuit but bring unparalleled energy and devotion to every bhajan we sing. We are actively looking to expand our bookings to neighboring villages.",
      achievements: [
        "Best Newcomer Dindi Award 2024",
        "Performed at 10+ local village jatra festivals"
      ],
      photos: [
        "https://images.unsplash.com/photo-1533174000259-20cbacb21526?w=800&q=80"
      ],
      ownerId: user3._id
    });

    console.log('Creating events...');
    const today = new Date();
    await Event.create({
      templeName: 'Vitthal Rukmini Mandir',
      village: 'Pandharpur',
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      performingGroupId: group1._id
    });

    await Event.create({
      templeName: 'Sant Dnyaneshwar Maharaj Mandir',
      village: 'Alandi',
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      performingGroupId: group2._id
    });

    await Event.create({
      templeName: 'Sant Tukaram Maharaj Gatha Mandir',
      village: 'Dehu',
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      performingGroupId: group3._id
    });

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
