/**
 * Test script to verify MongoDB connection
 * Run with: pnpm tsx scripts/test-mongodb.ts
 * Or: npx tsx scripts/test-mongodb.ts
 */

// IMPORTANT: Load environment variables FIRST before importing MongoDB modules
// We use require() to ensure synchronous loading before ES module imports
const { config } = require('dotenv');
const { resolve } = require('path');
// Load .env.local explicitly
const envPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envPath });

async function testMongoDB() {
  // Now import MongoDB modules using dynamic imports (after env vars are loaded)
  // This ensures process.env.MONGODB_URI is available when mongodb.ts is evaluated
  const { getDatabase } = await import('../lib/mongodb');
  const { createBaseStyleImage, getBaseStyleImages, deleteBaseStyleImage } = await import('../lib/models/BaseStyleImage');
  console.log('🧪 Testing MongoDB Connection');
  console.log('=============================\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣  Testing database connection...');
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    console.log(`   ✅ Connected to database: ${db.databaseName}`);
    console.log(`   📁 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`      - ${col.name}`);
    });
    console.log('');

    // Test 2: Create a test base style image
    console.log('2️⃣  Testing BaseStyleImage creation...');
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const newImage = await createBaseStyleImage({
      name: 'Test Image',
      imageUrl: testImageBase64,
      thumbnailUrl: testImageBase64,
    });
    console.log(`   ✅ Created base style image with ID: ${newImage._id}`);
    console.log('');

    // Test 3: Fetch all base style images
    console.log('3️⃣  Testing BaseStyleImage retrieval...');
    const images = await getBaseStyleImages();
    console.log(`   ✅ Retrieved ${images.length} base style image(s)`);
    images.forEach(img => {
      console.log(`      - ${img.name} (ID: ${img._id})`);
    });
    console.log('');

    // Test 4: Clean up - Delete test image
    console.log('4️⃣  Cleaning up test data...');
    if (newImage._id) {
      const deleted = await deleteBaseStyleImage(newImage._id.toString());
      if (deleted) {
        console.log(`   ✅ Deleted test image`);
      } else {
        console.log(`   ⚠️  Failed to delete test image`);
      }
    }
    console.log('');

    console.log('✅ All MongoDB tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB test failed:');
    console.error(error);
    process.exit(1);
  }
}

testMongoDB();

