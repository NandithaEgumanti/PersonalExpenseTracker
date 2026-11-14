
package com.example.expense.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.expense.entity.Category;
import com.example.expense.entity.CategoryBudget;
import com.example.expense.repository.CategoryBudgetRepository;

@Service
public class CategoryBudgetService {

    private final CategoryBudgetRepository repo;

    public CategoryBudgetService(CategoryBudgetRepository repo) {
        this.repo = repo;
    }

    // Save category budget
    public CategoryBudget saveBudget(CategoryBudget budget) {
        return repo.save(budget);
    }

    // Get all budgets for a particular user
    public List<CategoryBudget> getBudgetsByUser(Long userId) {
        return repo.findByUser_Id(userId);
    }

    // Find budget by user, category and month
    public Optional<CategoryBudget> getBudgetByCategory(
            Long userId,
            Category category,
            Integer month,
            Integer year) {

        return repo.findByUser_IdAndCategoryAndMonthAndYear(
                userId, category, month, year);
    }

    // Delete only if the budget belongs to the user
    public boolean deleteBudget(Integer id, Long userId) {

        Optional<CategoryBudget> budget =
                repo.findByIdAndUser_Id(id, userId);

        if (budget.isEmpty()) {
            return false;
        }

        repo.delete(budget.get());
        return true;
    }
}

