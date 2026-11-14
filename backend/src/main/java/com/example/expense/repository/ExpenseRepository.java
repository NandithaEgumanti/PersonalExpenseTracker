
package com.example.expense.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.expense.entity.Expense;
import com.example.expense.entity.TransactionType;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    // Check whether a user has expenses
    boolean existsByUser_Id(Long userId);

    // Get all expenses belonging to a user
    List<Expense> findByUser_Id(Long userId);

    // Find an expense by ID and its owner's ID
    Optional<Expense> findByIdAndUser_Id(Integer id, Long userId);

    // Calculate total expenses for a user within a date range
    @Query("""
        SELECT COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.user.id = :userId
        AND e.type = :type
        AND e.date BETWEEN :startDate AND :endDate
    """)
    BigDecimal getTotalExpenses(
        @Param("userId") Long userId,
        @Param("type") TransactionType type,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
