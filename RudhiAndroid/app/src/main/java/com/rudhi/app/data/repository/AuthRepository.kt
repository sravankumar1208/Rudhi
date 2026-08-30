package com.rudhi.app.data.repository

import com.rudhi.app.data.model.UserProfile
import com.rudhi.app.data.network.SupabaseClient
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.query.Columns

class AuthRepository {
    private val auth get() = SupabaseClient.auth
    private val postgrest get() = SupabaseClient.postgrest

    val currentUserId: String?
        get() = auth.currentSessionOrNull()?.user?.id

    suspend fun signIn(email: String, password: String): Boolean {
        auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        return currentUserId != null
    }

    suspend fun signUp(email: String, password: String, fullName: String, role: String): Boolean {
        auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
        val uid = currentUserId ?: return false
        
        val profile = UserProfile(
            id = uid,
            email = email,
            fullName = fullName,
            role = role,
            isAvailable = true,
            donationCount = 0
        )

        try {
            postgrest["profiles"].insert(profile)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return true
    }

    suspend fun getCurrentUserProfile(): UserProfile? {
        val uid = currentUserId ?: return null
        return try {
            postgrest["profiles"]
                .select { filter { eq("id", uid) } }
                .decodeSingleOrNull<UserProfile>()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun updateAvailability(isAvailable: Boolean): Boolean {
        val uid = currentUserId ?: return false
        return try {
            postgrest["profiles"].update(
                mapOf("is_available" to isAvailable)
            ) {
                filter { eq("id", uid) }
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun updateProfile(fullName: String, phone: String, address: String): Boolean {
        val uid = currentUserId ?: return false
        return try {
            postgrest["profiles"].update(
                mapOf(
                    "full_name" to fullName,
                    "phone" to phone,
                    "address" to address
                )
            ) {
                filter { eq("id", uid) }
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun resetPassword(email: String) {
        auth.resetPasswordForEmail(email)
    }

    suspend fun signOut() {
        auth.signOut()
    }
}
