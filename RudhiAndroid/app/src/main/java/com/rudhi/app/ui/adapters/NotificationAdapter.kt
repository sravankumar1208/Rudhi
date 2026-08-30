package com.rudhi.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.rudhi.app.data.model.AppNotification
import com.rudhi.app.databinding.ItemNotificationBinding

class NotificationAdapter(
    private var notifications: List<AppNotification>
) : RecyclerView.Adapter<NotificationAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemNotificationBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemNotificationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = notifications[position]
        with(holder.binding) {
            tvNotifTitle.text = item.title
            tvNotifBody.text = item.body
            tvNotifTime.text = item.createdAt ?: "Recently"
        }
    }

    override fun getItemCount(): Int = notifications.size

    fun updateData(newNotifications: List<AppNotification>) {
        notifications = newNotifications
        notifyDataSetChanged()
    }
}
