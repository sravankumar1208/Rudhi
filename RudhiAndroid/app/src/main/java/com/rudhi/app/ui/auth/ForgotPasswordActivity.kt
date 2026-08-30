package com.rudhi.app.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.rudhi.app.data.repository.AuthRepository
import com.rudhi.app.databinding.ActivityForgotPasswordBinding
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private val authRepo = AuthRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnSendResetLink.setOnClickListener {
            val email = binding.etResetEmail.text.toString().trim()
            if (email.isEmpty()) {
                Toast.makeText(this, "Please enter your email", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            binding.progressBar.visibility = View.VISIBLE
            binding.btnSendResetLink.isEnabled = false

            lifecycleScope.launch {
                try {
                    authRepo.resetPassword(email)
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        "Password reset link sent to $email!",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } catch (e: Exception) {
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        "Error sending link: ${e.localizedMessage}",
                        Toast.LENGTH_SHORT
                    ).show()
                } finally {
                    binding.progressBar.visibility = View.GONE
                    binding.btnSendResetLink.isEnabled = true
                }
            }
        }
    }
}
