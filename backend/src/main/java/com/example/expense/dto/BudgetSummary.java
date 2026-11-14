
package com.example.expense.dto;

import java.math.BigDecimal;

public class BudgetSummary {

    private BigDecimal monthlyLimit;
    private BigDecimal totalExpenses;
    private BigDecimal remainingBudget;
    private String status;

    public BudgetSummary(BigDecimal monthlyLimit,
            BigDecimal totalExpenses,
            BigDecimal remainingBudget,
            String status) {

        this.monthlyLimit = monthlyLimit;
        this.totalExpenses = totalExpenses;
        this.remainingBudget = remainingBudget;
        this.status = status;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public BigDecimal getRemainingBudget() {
        return remainingBudget;
    }

    public String getStatus() {
        return status;
    }
}
