# Firebase Setup Guide

## Firestore Rules and Indexes

The application requires specific Firestore security rules and indexes to function correctly. These files have been created in the project root:

- `firestore.rules` - Contains security rules for your Firestore database
- `firestore.indexes.json` - Contains required indexes for queries

## Deployment Instructions

1. Make sure you have the Firebase CLI installed and logged in:
   ```
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize Firebase in this project if you haven't already:
   ```
   firebase init
   ```
   - Select Firestore and any other services you need
   - Choose your project
   - Accept the default locations for the rules and indexes files

3. Deploy the Firestore rules and indexes:
   ```
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Manual Index Creation

If you're still encountering the index error, you can create the required index manually:

1. Click on the link in the error message in your browser console
2. Sign in to the Firebase console if prompted
3. Create the index with the following configuration:
   - Collection: `comments`
   - Fields:
     - `postId` (Ascending)
     - `createdAt` (Descending)
   - Query scope: Collection

This will resolve the "Firebase error: The query requires an index" error. 