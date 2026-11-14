
package com.example.expense.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.expense.dto.BudgetSummary;
import com.example.expense.entity.Budget;
import com.example.expense.entity.User;
import com.example.expense.repository.BudgetRepository;

@Service
public class BudgetService {

    private final BudgetRepository repo;
    private final ExpenseService expenseService;

    public BudgetService(
            BudgetRepository repo,
            ExpenseService expenseService) {

        this.repo = repo;
        this.expenseService = expenseService;
    }

    // Save budget for authenticated user
    public Budget saveBudget(Budget budget, User user) {
        budget.setUser(user);
        return repo.save(budget);
    }

    // Get only this user's budgets
    public List<Budget> getBudgetsByUserId(Long userId) {
        return repo.findByUserId(userId);
    }

    // Get budget only if it belongs to this user
    public Budget getBudgetById(Integer id, Long userId) {
        return repo.findByIdAndUser_Id(id, userId )
                .orElse(null);
    }

    // Delete only this user's budget
    public boolean deleteBudget(Integer id, Long userId) {

        Budget budget = getBudgetById(id, userId);

        if (budget == null) {
            return false;
        }

        repo.delete(budget);
        return true;
    }

    // Update only this user's budget
    public Budget updateBudget(
            Integer id, Budget b, Long userId) {

        Budget existing = getBudgetById(id, userId);

        if (existing == null) {
            return null;
        }

        existing.setMonthlyLimit(b.getMonthlyLimit());
        existing.setMonth(b.getMonth());
        existing.setYear(b.getYear());

        // Keep the original owner unchanged.
        return repo.save(existing);
    }

    // Get monthly budget for this user
    public Budget getMonthlyBudget(
            Long userId, Integer month, Integer year) {

        return repo.findByUser_IdAndMonthAndYear(
                userId, month, year
        ).orElse(null);
    }

    // Monthly budget summary
    public BudgetSummary getBudgetSummary(
            Long userId, Integer month, Integer year) {

        Budget budget = getMonthlyBudget(userId, month, year);

        if (budget == null || budget.getMonthlyLimit() == null) {
            return null;
        }

        BigDecimal totalExpenses =
                expenseService.getMonthlyExpenses(
                        userId, month, year);

        BigDecimal remainingBudget =
                budget.getMonthlyLimit().subtract(totalExpenses);

        String status;

        if (remainingBudget.compareTo(BigDecimal.ZERO) < 0) {
            status = "EXCEEDED";
        } else {
            status = "WITHIN BUDGET";
        }

        return new BudgetSummary(
                budget.getMonthlyLimit(),
                totalExpenses,
                remainingBudget,
                status
        );
    }
}
