
package com.example.expense.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.expense.entity.CategoryBudget;

@Repository
public interface CategoryBudgetRepository
        extends JpaRepository<CategoryBudget, Integer> {

    List<CategoryBudget> findByUser_Id(Long userId);

    Optional<CategoryBudget> findByUser_IdAndCategoryAndMonthAndYear(
            Long userId,
            com.example.expense.entity.Category category,
            Integer month,
            Integer year
    );
    Optional<CategoryBudget> findByIdAndUser_Id(
            Integer id, Long userId);
}
