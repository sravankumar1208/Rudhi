package com.rudhi.app.ui.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.UserProfile
import com.rudhi.app.data.repository.AuthRepository
import kotlinx.coroutines.launch

class ProfileViewModel : ViewModel() {

    private val authRepo = AuthRepository()

    private val _userProfile = MutableLiveData<UserProfile?>()
    val userProfile: LiveData<UserProfile?> = _userProfile

    fun loadProfile() {
        viewModelScope.launch {
            _userProfile.value = authRepo.getCurrentUserProfile()
        }
    }

    fun updateProfile(name: String, phone: String, address: String) {
        viewModelScope.launch {
            authRepo.updateProfile(name, phone, address)
            loadProfile()
        }
    }
}
