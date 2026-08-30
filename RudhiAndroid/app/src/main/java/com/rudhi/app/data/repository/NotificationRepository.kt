package com.rudhi.app.data.repository

import com.rudhi.app.data.model.AppNotification
import com.rudhi.app.data.network.SupabaseClient

class NotificationRepository {
    private val postgrest get() = SupabaseClient.postgrest
    private val auth get() = SupabaseClient.auth

    suspend fun getNotifications(): List<AppNotification> {
        val uid = auth.currentSessionOrNull()?.user?.id ?: return getMockNotifications()
        return try {
            postgrest["notifications"]
                .select { filter { eq("user_id", uid) } }
                .decodeList<AppNotification>()
        } catch (e: Exception) {
            e.printStackTrace()
            getMockNotifications()
        }
    }

    suspend fun markAllRead(): Boolean {
        val uid = auth.currentSessionOrNull()?.user?.id ?: return true
        return try {
            postgrest["notifications"].update(mapOf("read" to true)) {
                filter { eq("user_id", uid) }
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            true
        }
    }

    private fun getMockNotifications(): List<AppNotification> {
        return listOf(
            AppNotification(
                id = "notif_1",
                userId = "donor_user",
                type = "alert",
                title = "Emergency Request Near You",
                body = "A patient needs 2 units of O+ blood at Stanley Medical College.",
                read = false,
                createdAt = "2m ago"
            ),
            AppNotification(
                id = "notif_2",
                userId = "donor_user",
                type = "system",
                title = "Welcome to Rudhi",
                body = "Your donor profile is active and ready to save lives.",
                read = true,
                createdAt = "1d ago"
            )
        )
    }
}
