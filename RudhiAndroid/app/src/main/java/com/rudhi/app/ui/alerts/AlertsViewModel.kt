package com.rudhi.app.ui.alerts

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rudhi.app.data.model.AppNotification
import com.rudhi.app.data.repository.NotificationRepository
import kotlinx.coroutines.launch

class AlertsViewModel : ViewModel() {

    private val notifRepo = NotificationRepository()
    private val allNotifications = mutableListOf<AppNotification>()

    private val _notifications = MutableLiveData<List<AppNotification>>()
    val notifications: LiveData<List<AppNotification>> = _notifications

    fun loadNotifications() {
        viewModelScope.launch {
            val list = notifRepo.getNotifications()
            allNotifications.clear()
            allNotifications.addAll(list)
            _notifications.value = list
        }
    }

    fun filterNotifications(filter: String) {
        when (filter) {
            "unread" -> _notifications.value = allNotifications.filter { !it.read }
            "alerts" -> _notifications.value = allNotifications.filter { it.type == "alert" }
            else -> _notifications.value = allNotifications
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            notifRepo.markAllRead()
            loadNotifications()
        }
    }
}
