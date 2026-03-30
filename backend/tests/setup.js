// টেস্ট সেটআপ ফাইল
import { MongoMemoryServer } from 'mongodb-memory-server'; // mongodb-memory-server থেকে MongoMemoryServer ইমপোর্ট করা হচ্ছে
import mongoose from 'mongoose'; // mongoose ইমপোর্ট করা হচ্ছে

let mongoServer; // MongoMemoryServer ইনস্ট্যান্স রাখার জন্য একটি ভেরিয়েবল

// সকল টেস্টের আগে একবার সেটআপ করা হবে
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create(); // একটি ইন-মেমরি MongoDB সার্ভার তৈরি করা হচ্ছে
  const mongoUri = mongoServer.getUri(); // সার্ভারের URI (Uniform Resource Identifier) পেতে getUri() ব্যবহার করা হচ্ছে
  
  await mongoose.connect(mongoUri, { // mongoose কে উল্লিখিত URI তে কানেক্ট করা হচ্ছে
    maxPoolSize: 10, // সর্বাধিক কানেকশন পুল সাইজ 10 সেট করা হচ্ছে
    serverSelectionTimeoutMS: 5000, // সার্ভার সিলেকশনের জন্য সময়সীমা 5000ms সেট করা হচ্ছে
    socketTimeoutMS: 45000, // সকেটের জন্য সময়সীমা 45000ms সেট করা হচ্ছে
  });
});

// প্রতিটি টেস্টের পরে ক্লিনআপ করা হবে
afterEach(async () => {
  const collections = mongoose.connection.collections; // সকল সংগ্রহ (collections) পেতে mongoose.connection.collections ব্যবহার করা হচ্ছে
  
  for (const key in collections) { // প্রতিটি সংগ্রহের জন্য লুপ চালানো হচ্ছে
    await collections[key].deleteMany({}); // প্রতিটি সংগ্রহের সকল ডকুমেন্ট মুছে দেওয়া হচ্ছে
  }
});

// সকল টেস্টের পরে ক্লিনআপ করা হবে
afterAll(async () => {
  await mongoose.connection.dropDatabase(); // সকল ডেটাবেস ড্রপ করা হচ্ছে
  await mongoose.connection.close(); // mongoose কানেকশন বন্ধ করা হচ্ছে
  await mongoServer.stop(); // ইন-মেমরি MongoDB সার্ভার বন্ধ করা হচ্ছে
});
