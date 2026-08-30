package com.rudhi.app

import android.app.Application
import com.rudhi.app.data.network.SupabaseClient

class RudhiApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SupabaseClient.init(this)
    }
}
