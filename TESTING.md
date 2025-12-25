# Testing Guide for API and MongoDB

This guide shows you how to test the Base Styles API endpoints and verify MongoDB connection.

## Prerequisites

1. **MongoDB Connection**: Make sure you have `MONGODB_URI` set in `.env.local`
2. **Dev Server**: Start your Next.js dev server with `pnpm dev`

## Method 1: Using the Test Scripts

### Test MongoDB Connection Directly

```bash
# Install tsx if you don't have it (one-time)
pnpm add -D tsx

# Run MongoDB connection test
pnpm tsx scripts/test-mongodb.ts
```

This will:
- Test database connection
- Create a test base style image
- Retrieve all images
- Clean up test data

### Test API Endpoints

```bash
# Make sure dev server is running first: pnpm dev
# Then in another terminal:
./scripts/test-api.sh
```

This will test all CRUD operations:
- GET all base styles
- POST create new base style
- GET specific base style by ID
- PUT update base style
- DELETE base style

## Method 2: Manual Testing with cURL

### 1. Test GET all base styles

```bash
curl http://localhost:3000/api/base-styles
```

Expected response: `[]` (empty array initially)

### 2. Test POST - Create a new base style

```bash
curl -X POST http://localhost:3000/api/base-styles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Style",
    "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

Expected response: JSON object with the created base style (includes `_id`)

### 3. Test GET specific base style by ID

Replace `{ID}` with the `_id` from step 2:

```bash
curl http://localhost:3000/api/base-styles/{ID}
```

### 4. Test PUT - Update base style

Replace `{ID}` with the `_id` from step 2:

```bash
curl -X PUT http://localhost:3000/api/base-styles/{ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Style Name"
  }'
```

### 5. Test DELETE - Delete base style

Replace `{ID}` with the `_id` from step 2:

```bash
curl -X DELETE http://localhost:3000/api/base-styles/{ID}
```

Expected response: `{"success":true,"message":"Base style image deleted"}`

## Method 3: Using a REST Client (Postman, Insomnia, etc.)

### Base URL
```
http://localhost:3000/api/base-styles
```

### Endpoints

1. **GET** `/api/base-styles`
   - No body required
   - Returns array of all base style images

2. **POST** `/api/base-styles`
   - Body (JSON):
     ```json
     {
       "name": "Style Name",
       "imageUrl": "data:image/png;base64,...",
       "thumbnailUrl": "data:image/png;base64,..." // optional
     }
     ```
   - Returns created base style image

3. **GET** `/api/base-styles/{id}`
   - No body required
   - Returns specific base style image

4. **PUT** `/api/base-styles/{id}`
   - Body (JSON, all fields optional):
     ```json
     {
       "name": "Updated Name",
       "imageUrl": "data:image/png;base64,...",
       "thumbnailUrl": "data:image/png;base64,..."
     }
     ```
   - Returns updated base style image

5. **DELETE** `/api/base-styles/{id}`
   - No body required
   - Returns success message

## Method 4: Using Browser DevTools

1. Open your browser and go to `http://localhost:3000`
2. Open DevTools (F12)
3. Go to Console tab
4. Run this JavaScript:

```javascript
// Test GET
fetch('/api/base-styles')
  .then(r => r.json())
  .then(console.log);

// Test POST
fetch('/api/base-styles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Browser Test',
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })
})
  .then(r => r.json())
  .then(console.log);
```

## Troubleshooting

### MongoDB Connection Error

If you see `Please add your Mongo URI to .env.local`:
1. Create `.env.local` file in project root
2. Add: `MONGODB_URI=your_connection_string_here`
3. Restart dev server

### Connection Timeout

- Check if MongoDB is running (local) or accessible (Atlas)
- Verify connection string is correct
- Check network/firewall settings

### 500 Internal Server Error

- Check server logs in terminal where `pnpm dev` is running
- Verify MongoDB connection string is valid
- Check if database exists

### Invalid Base64 Error

Make sure `imageUrl` starts with `data:image/` prefix:
- ✅ Valid: `data:image/png;base64,iVBORw0KG...`
- ❌ Invalid: `iVBORw0KG...` (missing prefix)

## Expected Test Results

When everything works correctly:

1. **MongoDB Test**: Should show connected database and collections
2. **GET /api/base-styles**: Returns `[]` initially
3. **POST /api/base-styles**: Returns 201 with created object
4. **GET /api/base-styles/{id}**: Returns 200 with the object
5. **PUT /api/base-styles/{id}**: Returns 200 with updated object
6. **DELETE /api/base-styles/{id}**: Returns 200 with success message

