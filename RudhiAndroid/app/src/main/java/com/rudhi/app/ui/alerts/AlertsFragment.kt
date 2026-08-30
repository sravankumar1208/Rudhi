package com.rudhi.app.ui.alerts

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.rudhi.app.R
import com.rudhi.app.databinding.FragmentAlertsBinding
import com.rudhi.app.ui.adapters.NotificationAdapter

class AlertsFragment : Fragment() {

    private var _binding: FragmentAlertsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: AlertsViewModel by viewModels()
    private lateinit var adapter: NotificationAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAlertsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = NotificationAdapter(emptyList())
        binding.rvNotifications.layoutManager = LinearLayoutManager(requireContext())
        binding.rvNotifications.adapter = adapter

        binding.chipGroupNotifications.setOnCheckedStateChangeListener { group, checkedIds ->
            when (checkedIds.firstOrNull()) {
                R.id.chip_unread -> viewModel.filterNotifications("unread")
                R.id.chip_alerts -> viewModel.filterNotifications("alerts")
                else -> viewModel.filterNotifications("all")
            }
        }

        binding.btnMarkAllRead.setOnClickListener {
            viewModel.markAllRead()
        }

        viewModel.notifications.observe(viewLifecycleOwner) { list ->
            if (list.isEmpty()) {
                binding.tvEmptyNotifications.visibility = View.VISIBLE
                binding.rvNotifications.visibility = View.GONE
            } else {
                binding.tvEmptyNotifications.visibility = View.GONE
                binding.rvNotifications.visibility = View.VISIBLE
                adapter.updateData(list)
            }
        }

        viewModel.loadNotifications()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
