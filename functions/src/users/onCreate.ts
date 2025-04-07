import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const createUserProfile = functions.auth.user().onCreate(
  async (user: admin.auth.UserRecord) => {
    const userRef = db.collection('users').doc(user.uid)

    const newUser = {
      username: user.displayName || '',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      curriculum: '',
      examLevels: [],
      postCount: 0,
      followers: [],
      followerCount: 0,
      following: [],
      followingCount: 0,
      about: '',
      communities: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await userRef.set(newUser)
    console.log(`Created user profile for ${user.uid}`)
  }
)
