package com.rudhi.app.ui.find

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.Hospital
import com.rudhi.app.data.repository.HospitalRepository
import kotlinx.coroutines.launch

class FindViewModel : ViewModel() {

    private val hospitalRepo = HospitalRepository()
    private val allHospitals = mutableListOf<Hospital>()

    private val _hospitals = MutableLiveData<List<Hospital>>()
    val hospitals: LiveData<List<Hospital>> = _hospitals

    fun loadHospitals() {
        viewModelScope.launch {
            val list = hospitalRepo.getHospitals()
            allHospitals.clear()
            allHospitals.addAll(list)
            _hospitals.value = list
        }
    }

    fun filterHospitals(query: String) {
        if (query.isBlank()) {
            _hospitals.value = allHospitals
        } else {
            _hospitals.value = allHospitals.filter {
                it.name.contains(query, ignoreCase = true) ||
                        it.address.contains(query, ignoreCase = true) ||
                        it.type.contains(query, ignoreCase = true)
            }
        }
    }
}
