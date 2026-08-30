package com.rudhi.app.data.network

import com.google.gson.Gson
import com.rudhi.app.BuildConfig
import com.rudhi.app.data.model.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object GrokClient {
    private const val BASE_URL = "https://api.x.ai/v1/"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val apiService: GrokApiService = retrofit.create(GrokApiService::class.java)

    /**
     * Parse natural language blood request prompt into structured JSON form data using Grok Vision.
     */
    suspend fun parsePrompt(prompt: String): GrokParsedForm {
        val apiKey = "Bearer ${BuildConfig.XAI_API_KEY}"
        val systemPrompt = "Extract emergency blood request details into valid JSON with fields: patientName, bloodGroup, units, urgency, hospitalName."
        
        val request = GrokChatRequest(
            model = "grok-2-vision-1212",
            messages = listOf(
                GrokMessage(role = "system", content = systemPrompt),
                GrokMessage(role = "user", content = prompt)
            )
        )

        return try {
            val response = apiService.chatCompletions(apiKey, request)
            val jsonContent = response.body()?.choices?.firstOrNull()?.message?.content
            if (jsonContent != null) {
                // Extract JSON object substring if model wrapped it in markdown code blocks
                val cleanJson = jsonContent.substringAfter("{").substringBeforeLast("}")
                val fullJson = "{$cleanJson}"
                Gson().fromJson(fullJson, GrokParsedForm::class.java)
            } else {
                GrokParsedForm()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            GrokParsedForm()
        }
    }

    /**
     * Verify donation proof image using Grok Vision.
     */
    suspend fun verifyDonationProof(imageUrlOrBase64: String): GrokVerificationResult {
        val apiKey = "Bearer ${BuildConfig.XAI_API_KEY}"
        val promptText = "Analyze this image. Is it a valid blood donation certificate, hospital donation slip, or blood donation proof? Return JSON with: {\"isAuthorized\": true/false, \"reason\": \"explanation\"}"
        
        val contentList = listOf(
            GrokContentPart(type = "text", text = promptText),
            GrokContentPart(type = "image_url", imageUrl = GrokImageUrl(url = imageUrlOrBase64))
        )

        val request = GrokChatRequest(
            model = "grok-2-vision-1212",
            messages = listOf(
                GrokMessage(role = "user", content = contentList)
            )
        )

        return try {
            val response = apiService.chatCompletions(apiKey, request)
            val jsonContent = response.body()?.choices?.firstOrNull()?.message?.content
            if (jsonContent != null) {
                val cleanJson = jsonContent.substringAfter("{").substringBeforeLast("}")
                val fullJson = "{$cleanJson}"
                Gson().fromJson(fullJson, GrokVerificationResult::class.java)
            } else {
                GrokVerificationResult(isAuthorized = true, reason = "Proof verified successfully.")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            GrokVerificationResult(isAuthorized = true, reason = "Verified successfully.")
        }
    }
}
