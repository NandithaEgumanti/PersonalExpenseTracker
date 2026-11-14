
package com.example.expense.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.expense.entity.Category;
import com.example.expense.entity.CategoryBudget;
import com.example.expense.entity.User;
import com.example.expense.service.CategoryBudgetService;
import com.example.expense.service.UserService;

@RestController
@RequestMapping("/api/category-budgets")
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryBudgetController {

    private final CategoryBudgetService cbs;
    private final UserService userService;

    public CategoryBudgetController(
            CategoryBudgetService cbs,
            UserService userService) {
        this.cbs = cbs;
        this.userService = userService;
    }

    private User getLoggedInUser(Authentication authentication) {
        return userService.getUserByEmail(authentication.getName());
    }

    private boolean isValidBudget(CategoryBudget budget) {
        return budget.getCategory() != null
                && budget.getCategory() != Category.SALARY
                && budget.getMonthlyLimit() != null
                && budget.getMonthlyLimit().compareTo(BigDecimal.ZERO) > 0
                && budget.getMonth() != null
                && budget.getMonth() >= 1
                && budget.getMonth() <= 12
                && budget.getYear() != null
                && budget.getYear() >= 2000;
    }

    // Add category budget
    @PostMapping
    public ResponseEntity<?> addCategoryBudget(
            @RequestBody CategoryBudget budget,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }

        if (!isValidBudget(budget)) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid category, positive limit, month and year. Salary is not an expense category.");
        }

        Optional<CategoryBudget> existing =
                cbs.getBudgetByCategory(
                        user.getId(),
                        budget.getCategory(),
                        budget.getMonth(),
                        budget.getYear());

        if (existing.isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Budget already exists for this category and month. Please update it.");
        }

        budget.setId(null);
        budget.setUser(user);

        CategoryBudget saved = cbs.saveBudget(budget);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get all category budgets for logged-in user
    @GetMapping
    public ResponseEntity<List<CategoryBudget>> getAllCategoryBudgets(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                cbs.getBudgetsByUser(user.getId()));
    }

    // Update category budget limit
    @PutMapping
    public ResponseEntity<?> updateCategoryBudget(
            @RequestBody CategoryBudget budget,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }

        if (!isValidBudget(budget)) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid category, positive limit, month and year.");
        }

        Optional<CategoryBudget> existing =
                cbs.getBudgetByCategory(
                        user.getId(),
                        budget.getCategory(),
                        budget.getMonth(),
                        budget.getYear());

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CategoryBudget current = existing.get();
        current.setMonthlyLimit(budget.getMonthlyLimit());

        CategoryBudget updated = cbs.saveBudget(current);

        return ResponseEntity.ok(updated);
    }

    // Delete category budget
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCategoryBudget(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }
        boolean deleted = cbs.deleteBudget(id, user.getId());

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                "Category budget deleted successfully");
        
        
    }
}
