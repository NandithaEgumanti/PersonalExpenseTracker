
package com.example.expense.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.expense.entity.User;
import com.example.expense.repository.UserRepository;
import com.example.expense.repository.ExpenseRepository;
import com.example.expense.repository.BudgetRepository;

@Service
public class UserService {

    private final UserRepository repo;
    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repo,
                       ExpenseRepository expenseRepo,
                       BudgetRepository budgetRepo,
                       PasswordEncoder passwordEncoder) {

        this.repo = repo;
        this.expenseRepo = expenseRepo;
        this.budgetRepo = budgetRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public User addUser(User user) {

        user.setPassword(
            passwordEncoder.encode(user.getPassword())
        );

        return repo.save(user);
    }

    public List<User> getAllUsers() {
        return repo.findAll();
    }

    public User getUserById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public boolean hasLinkedRecords(Long id) {
        return expenseRepo.existsByUser_Id(id)
                || budgetRepo.existsByUser_Id(id);
    }

    public void deleteUser(Long id) {
        repo.deleteById(id);
    }
    public User getUserByEmail(String email) {
        return repo.findByEmail(email).orElse(null);
    }

	

	
	}

