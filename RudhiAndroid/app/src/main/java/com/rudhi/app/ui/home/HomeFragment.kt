package com.rudhi.app.ui.home

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.databinding.FragmentHomeBinding
import com.rudhi.app.ui.adapters.RequestAdapter
import com.rudhi.app.ui.donor.DonorAlertActivity

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private val viewModel: HomeViewModel by viewModels()
    private lateinit var adapter: RequestAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = RequestAdapter(
            requests = emptyList(),
            onAcceptClick = { request -> openDonorAlert(request) },
            onViewClick = { request -> openDonorAlert(request) }
        )

        binding.rvRequests.layoutManager = LinearLayoutManager(requireContext())
        binding.rvRequests.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadData()
        }

        binding.switchAvailable.setOnCheckedChangeListener { _, isChecked ->
            viewModel.toggleAvailability(isChecked)
        }

        observeViewModel()
        viewModel.loadData()
    }

    private fun observeViewModel() {
        viewModel.userProfile.observe(viewLifecycleOwner) { profile ->
            val initial = profile?.fullName?.firstOrNull()?.uppercase() ?: "U"
            binding.tvAvatarInitial.text = initial
        }

        viewModel.isAvailable.observe(viewLifecycleOwner) { available ->
            binding.switchAvailable.isChecked = available
        }

        viewModel.savedLivesCount.observe(viewLifecycleOwner) { count ->
            binding.tvImpactHero.text = "You've saved $count lives through Rudhi"
        }

        viewModel.urgentRequests.observe(viewLifecycleOwner) { requests ->
            binding.swipeRefresh.isRefreshing = false
            if (requests.isEmpty()) {
                binding.tvEmptyRequests.visibility = View.VISIBLE
                binding.rvRequests.visibility = View.GONE
            } else {
                binding.tvEmptyRequests.visibility = View.GONE
                binding.rvRequests.visibility = View.VISIBLE
                adapter.updateData(requests)
            }
        }
    }

    private fun openDonorAlert(request: BloodRequest) {
        val intent = Intent(requireContext(), DonorAlertActivity::class.java).apply {
            putExtra("REQUEST_ID", request.id)
            putExtra("HOSPITAL_NAME", request.hospitalName)
            putExtra("PATIENT_NAME", request.patientName)
            putExtra("BLOOD_GROUP", request.bloodGroup)
            putExtra("UNITS_NEEDED", request.unitsNeeded)
            putExtra("URGENCY", request.urgency)
        }
        startActivity(intent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
