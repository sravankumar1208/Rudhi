package com.rudhi.app.ui.find

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.rudhi.app.data.model.Hospital
import com.rudhi.app.databinding.FragmentFindBinding
import com.rudhi.app.ui.adapters.HospitalAdapter

class FindFragment : Fragment() {

    private var _binding: FragmentFindBinding? = null
    private val binding get() = _binding!!
    private val viewModel: FindViewModel by viewModels()
    private lateinit var adapter: HospitalAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFindBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = HospitalAdapter(
            hospitals = emptyList(),
            onCallClick = { hospital -> makePhoneCall(hospital.phone) },
            onNavigateClick = { hospital -> openMapsNavigation(hospital) }
        )

        binding.rvHospitals.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHospitals.adapter = adapter

        binding.etSearchHospital.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                viewModel.filterHospitals(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        viewModel.hospitals.observe(viewLifecycleOwner) { list ->
            adapter.updateData(list)
        }

        viewModel.loadHospitals()
    }

    private fun makePhoneCall(phone: String) {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
        startActivity(intent)
    }

    private fun openMapsNavigation(hospital: Hospital) {
        val gmmIntentUri = Uri.parse("google.navigation:q=${hospital.latitude},${hospital.longitude}")
        val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).apply {
            setPackage("com.google.android.apps.maps")
        }
        if (mapIntent.resolveActivity(requireActivity().packageManager) != null) {
            startActivity(mapIntent)
        } else {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}"))
            startActivity(browserIntent)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
