package com.rudhi.app.data.network

import com.rudhi.app.data.model.GrokChatRequest
import com.rudhi.app.data.model.GrokChatResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface GrokApiService {
    @POST("chat/completions")
    suspend fun chatCompletions(
        @Header("Authorization") authorization: String,
        @Body request: GrokChatRequest
    ): Response<GrokChatResponse>
}
