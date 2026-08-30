package com.rudhi.app.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.data.model.UserProfile
import com.rudhi.app.data.repository.AuthRepository
import com.rudhi.app.data.repository.BloodRequestRepository
import com.rudhi.app.data.repository.DonationRepository
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {

    private val authRepo = AuthRepository()
    private val requestRepo = BloodRequestRepository()
    private val donationRepo = DonationRepository()

    private val _userProfile = MutableLiveData<UserProfile?>()
    val userProfile: LiveData<UserProfile?> = _userProfile

    private val _urgentRequests = MutableLiveData<List<BloodRequest>>()
    val urgentRequests: LiveData<List<BloodRequest>> = _urgentRequests

    private val _savedLivesCount = MutableLiveData<Int>()
    val savedLivesCount: LiveData<Int> = _savedLivesCount

    private val _isAvailable = MutableLiveData<Boolean>()
    val isAvailable: LiveData<Boolean> = _isAvailable

    fun loadData() {
        viewModelScope.launch {
            val profile = authRepo.getCurrentUserProfile()
            _userProfile.value = profile
            _isAvailable.value = profile?.isAvailable ?: true
            _savedLivesCount.value = profile?.donationCount ?: 0

            val requests = requestRepo.getUrgentRequests()
            _urgentRequests.value = requests
        }
    }

    fun toggleAvailability(available: Boolean) {
        _isAvailable.value = available
        viewModelScope.launch {
            authRepo.updateAvailability(available)
        }
    }
}
