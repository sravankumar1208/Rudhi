package com.rudhi.app.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.rudhi.app.R
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.data.repository.BloodRequestRepository
import com.rudhi.app.databinding.ActivityMyRequestsBinding
import com.rudhi.app.ui.adapters.RequestAdapter
import com.rudhi.app.ui.request.RequestTrackingActivity
import kotlinx.coroutines.launch

class MyRequestsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMyRequestsBinding
    private val bloodRequestRepo = BloodRequestRepository()
    private lateinit var adapter: RequestAdapter
    private var allRequests = listOf<BloodRequest>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMyRequestsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        adapter = RequestAdapter(
            requests = emptyList(),
            onAcceptClick = { req -> openTracking(req) },
            onViewClick = { req -> openTracking(req) }
        )

        binding.rvMyRequests.layoutManager = LinearLayoutManager(this)
        binding.rvMyRequests.adapter = adapter

        binding.chipGroupRequestFilter.setOnCheckedStateChangeListener { _, checkedIds ->
            val filter = when (checkedIds.firstOrNull()) {
                R.id.chip_filter_searching -> "searching"
                R.id.chip_filter_matched -> "matched"
                R.id.chip_filter_fulfilled -> "fulfilled"
                else -> "all"
            }
            filterRequests(filter)
        }

        lifecycleScope.launch {
            allRequests = bloodRequestRepo.getMyRequests()
            filterRequests("all")
        }
    }

    private fun filterRequests(filter: String) {
        val filtered = if (filter == "all") allRequests else allRequests.filter { it.status == filter }
        if (filtered.isEmpty()) {
            binding.tvEmptyMyRequests.visibility = View.VISIBLE
            binding.rvMyRequests.visibility = View.GONE
        } else {
            binding.tvEmptyMyRequests.visibility = View.GONE
            binding.rvMyRequests.visibility = View.VISIBLE
            adapter.updateData(filtered)
        }
    }

    private fun openTracking(request: BloodRequest) {
        val intent = Intent(this, RequestTrackingActivity::class.java).apply {
            putExtra("REQUEST_ID", request.id)
            putExtra("HOSPITAL_NAME", request.hospitalName)
            putExtra("PATIENT_NAME", request.patientName)
            putExtra("UNITS", request.unitsNeeded)
        }
        startActivity(intent)
    }
}
