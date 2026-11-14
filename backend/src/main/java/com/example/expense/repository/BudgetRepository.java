
package com.example.expense.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.expense.entity.Budget;

public interface BudgetRepository extends JpaRepository<Budget, Integer> {

    boolean existsByUser_Id(Long id);

    List<Budget> findByUserId(Long userId);

    Optional<Budget> findByIdAndUser_Id(Integer id, Long userId);

    Optional<Budget> findByUser_IdAndMonthAndYear(
            Long userId,
            Integer month,
            Integer year
    );
}
