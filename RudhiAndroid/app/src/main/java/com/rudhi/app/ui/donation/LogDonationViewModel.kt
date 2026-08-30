package com.rudhi.app.ui.donation

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.Donation
import com.rudhi.app.data.model.GrokVerificationResult
import com.rudhi.app.data.network.GrokClient
import com.rudhi.app.data.repository.DonationRepository
import kotlinx.coroutines.launch

class LogDonationViewModel : ViewModel() {

    private val donationRepo = DonationRepository()

    private val _verificationResult = MutableLiveData<GrokVerificationResult>()
    val verificationResult: LiveData<GrokVerificationResult> = _verificationResult

    private val _createdDonation = MutableLiveData<Donation?>()
    val createdDonation: LiveData<Donation?> = _createdDonation

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun confirmDonationWithProof(
        requestId: String?,
        hospitalName: String,
        unitsDonated: Int,
        proofUrlOrBase64: String?,
        feedback: String?
    ) {
        _isLoading.value = true
        viewModelScope.launch {
            val verifyResult = if (!proofUrlOrBase64.isNullOrEmpty()) {
                GrokClient.verifyDonationProof(proofUrlOrBase64)
            } else {
                GrokVerificationResult(isAuthorized = true, reason = "Donation confirmed.")
            }

            _verificationResult.value = verifyResult

            if (verifyResult.isAuthorized) {
                val donation = donationRepo.logDonation(
                    requestId = requestId,
                    hospitalName = hospitalName,
                    unitsDonated = unitsDonated,
                    proofUrl = proofUrlOrBase64,
                    feedback = feedback
                )
                _createdDonation.value = donation
            }
            _isLoading.value = false
        }
    }
}
