
package com.example.expense.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.expense.entity.Expense;
import com.example.expense.entity.TransactionType;
import com.example.expense.entity.User;
import com.example.expense.repository.ExpenseRepository;

@Service
public class ExpenseService {

    private final ExpenseRepository repo;

    public ExpenseService(ExpenseRepository repo) {
        this.repo = repo;
    }

    // Add expense for the authenticated user
    public Expense addExpense(Expense expense, User user) {
        expense.setUser(user);
        return repo.save(expense);
    }

    // Get only the authenticated user's expenses
    public List<Expense> getExpensesByUser(Long userId) {
        return repo.findByUser_Id(userId);
    }

    // Get expense only if it belongs to this user
    public Expense getExpenseById(Integer id, Long userId) {
        return repo.findByIdAndUser_Id(id, userId)
                .orElse(null);
    }

    // Update only the authenticated user's expense
    public Expense updateExpense(
            Integer id, Expense expense, Long userId) {

        Expense oldExpense = getExpenseById(id, userId);

        if (oldExpense == null) {
            return null;
        }

        oldExpense.setAmount(expense.getAmount());
        oldExpense.setType(expense.getType());
        oldExpense.setCategory(expense.getCategory());
        oldExpense.setDescription(expense.getDescription());
        oldExpense.setDate(expense.getDate());

        // Keep the existing owner unchanged
        return repo.save(oldExpense);
    }

    // Delete only the authenticated user's expense
    public boolean deleteExpense(Integer id, Long userId) {

        Expense expense = getExpenseById(id, userId);

        if (expense == null) {
            return false;
        }

        repo.delete(expense);
        return true;
    }

    // Calculate monthly expenses for a particular user
    public BigDecimal getMonthlyExpenses(
            Long userId, Integer month, Integer year) {

        LocalDate startDate = LocalDate.of(year, month, 1);

        LocalDate endDate = startDate.withDayOfMonth(
                startDate.lengthOfMonth());

        return repo.getTotalExpenses(
                userId,
                TransactionType.EXPENSE,
                startDate,
                endDate);
    }
}


