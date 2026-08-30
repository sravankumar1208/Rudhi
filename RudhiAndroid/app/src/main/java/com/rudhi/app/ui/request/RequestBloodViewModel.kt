package com.rudhi.app.ui.request

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.data.model.GrokParsedForm
import com.rudhi.app.data.network.GrokClient
import com.rudhi.app.data.repository.BloodRequestRepository
import kotlinx.coroutines.launch

class RequestBloodViewModel : ViewModel() {

    private val bloodRequestRepo = BloodRequestRepository()

    private val _parsedForm = MutableLiveData<GrokParsedForm>()
    val parsedForm: LiveData<GrokParsedForm> = _parsedForm

    private val _createdRequestId = MutableLiveData<String?>()
    val createdRequestId: LiveData<String?> = _createdRequestId

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun parseAiPrompt(prompt: String) {
        if (prompt.isBlank()) return
        _isLoading.value = true
        viewModelScope.launch {
            val parsed = GrokClient.parsePrompt(prompt)
            _parsedForm.value = parsed
            _isLoading.value = false
        }
    }

    fun submitRequest(request: BloodRequest) {
        _isLoading.value = true
        viewModelScope.launch {
            val reqId = bloodRequestRepo.createBloodRequest(request)
            _createdRequestId.value = reqId
            _isLoading.value = false
        }
    }
}
