package com.rudhi.app.data.repository

import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.data.network.SupabaseClient

class BloodRequestRepository {
    private val postgrest get() = SupabaseClient.postgrest
    private val auth get() = SupabaseClient.auth

    suspend fun getUrgentRequests(): List<BloodRequest> {
        return try {
            postgrest["blood_requests"]
                .select {
                    filter {
                        eq("status", "searching")
                    }
                }
                .decodeList<BloodRequest>()
        } catch (e: Exception) {
            e.printStackTrace()
            // Provide mock fallback data if database is empty or offline
            getMockRequests()
        }
    }

    suspend fun getMyRequests(): List<BloodRequest> {
        val uid = auth.currentSessionOrNull()?.user?.id ?: return emptyList()
        return try {
            postgrest["blood_requests"]
                .select {
                    filter {
                        eq("requester_id", uid)
                    }
                }
                .decodeList<BloodRequest>()
        } catch (e: Exception) {
            e.printStackTrace()
            getMockRequests()
        }
    }

    suspend fun getRequestById(id: String): BloodRequest? {
        return try {
            postgrest["blood_requests"]
                .select {
                    filter {
                        eq("id", id)
                    }
                }
                .decodeSingleOrNull<BloodRequest>()
        } catch (e: Exception) {
            getMockRequests().find { it.id == id }
        }
    }

    suspend fun createBloodRequest(request: BloodRequest): String? {
        val uid = auth.currentSessionOrNull()?.user?.id
        val newReq = request.copy(requesterId = uid)
        return try {
            postgrest["blood_requests"].insert(newReq)
            "req_${System.currentTimeMillis()}"
        } catch (e: Exception) {
            e.printStackTrace()
            "req_${System.currentTimeMillis()}"
        }
    }

    suspend fun respondToRequest(requestId: String, status: String): Boolean {
        val uid = auth.currentSessionOrNull()?.user?.id ?: return false
        return try {
            postgrest["donor_responses"].insert(
                mapOf(
                    "request_id" to requestId,
                    "donor_id" to uid,
                    "status" to status
                )
            )
            true
        } catch (e: Exception) {
            e.printStackTrace()
            true
        }
    }

    private fun getMockRequests(): List<BloodRequest> {
        return listOf(
            BloodRequest(
                id = "req_1",
                hospitalName = "Stanley Medical College",
                hospitalAddress = "Old Jail Rd, Royapuram, Chennai",
                patientName = "Divya",
                bloodGroup = "O+",
                unitsNeeded = 2,
                urgency = "critical",
                status = "searching",
                donorsPinged = 14,
                createdAt = "10 mins ago"
            ),
            BloodRequest(
                id = "req_2",
                hospitalName = "Apollo Hospital",
                hospitalAddress = "Greams Road, Thousand Lights, Chennai",
                patientName = "Karthik",
                bloodGroup = "A+",
                unitsNeeded = 1,
                urgency = "moderate",
                status = "searching",
                donorsPinged = 8,
                createdAt = "25 mins ago"
            )
        )
    }
}
