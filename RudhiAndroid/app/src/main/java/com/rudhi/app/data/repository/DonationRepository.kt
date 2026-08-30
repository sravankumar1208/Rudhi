package com.rudhi.app.data.repository

import com.rudhi.app.data.model.Donation
import com.rudhi.app.data.network.SupabaseClient

class DonationRepository {
    private val postgrest get() = SupabaseClient.postgrest
    private val auth get() = SupabaseClient.auth

    suspend fun getMyDonations(): List<Donation> {
        val uid = auth.currentSessionOrNull()?.user?.id ?: return getMockDonations()
        return try {
            postgrest["donations"]
                .select {
                    filter {
                        eq("donor_id", uid)
                    }
                }
                .decodeList<Donation>()
        } catch (e: Exception) {
            e.printStackTrace()
            getMockDonations()
        }
    }

    suspend fun getDonationById(id: String): Donation? {
        return try {
            postgrest["donations"]
                .select {
                    filter {
                        eq("id", id)
                    }
                }
                .decodeSingleOrNull<Donation>()
        } catch (e: Exception) {
            getMockDonations().find { it.id == id }
        }
    }

    suspend fun logDonation(
        requestId: String?,
        hospitalName: String,
        unitsDonated: Int,
        proofUrl: String?,
        feedback: String?
    ): Donation {
        val uid = auth.currentSessionOrNull()?.user?.id ?: "donor_user"
        val donation = Donation(
            id = "don_${System.currentTimeMillis()}",
            donorId = uid,
            requestId = requestId,
            hospitalName = hospitalName,
            unitsDonated = unitsDonated,
            status = "confirmed",
            proofUrl = proofUrl,
            feedback = feedback,
            donatedAt = "2026-08-29"
        )

        try {
            postgrest["donations"].insert(donation)
            if (requestId != null) {
                postgrest["blood_requests"].update(mapOf("status" to "fulfilled")) {
                    filter { eq("id", requestId) }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return donation
    }

    private fun getMockDonations(): List<Donation> {
        return listOf(
            Donation(
                id = "don_1",
                donorId = "donor_user",
                hospitalName = "Stanley Medical College",
                unitsDonated = 1,
                status = "confirmed",
                donatedAt = "2026-08-29"
            )
        )
    }
}
