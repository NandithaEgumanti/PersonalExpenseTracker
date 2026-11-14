

package com.example.expense.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.expense.dto.BudgetSummary;
import com.example.expense.entity.Budget;
import com.example.expense.entity.User;
import com.example.expense.service.BudgetService;
import com.example.expense.service.UserService;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "http://localhost:5173")
public class BudgetController {

    private final BudgetService bs;
    private final UserService userService;

    public BudgetController(
            BudgetService bs,
            UserService userService) {

        this.bs = bs;
        this.userService = userService;
    }

    // Find logged-in user
    private User getLoggedInUser(Authentication authentication) {
        return userService.getUserByEmail(authentication.getName());
    }

    // Add budget
    @PostMapping
    public ResponseEntity<Budget> addBudget(
            @RequestBody Budget b,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Budget saved = bs.saveBudget(b, user);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get only logged-in user's budgets
    @GetMapping
    public ResponseEntity<List<Budget>> getAllBudgets(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                bs.getBudgetsByUserId(user.getId()));
    }

    // Get budget by ID, checking ownership
    @GetMapping("/{id}")
    public ResponseEntity<Budget> getBudget(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Budget b = bs.getBudgetById(id, user.getId());

        if (b == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(b);
    }

    // Delete budget
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBudget(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }

        boolean deleted = bs.deleteBudget(id, user.getId());

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok("Budget deleted successfully");
    }

    // Update budget
    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Integer id,
            @RequestBody Budget b,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Budget updated = bs.updateBudget(id, b, user.getId());

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    // Get monthly budget summary for logged-in user
    @GetMapping("/summary")
    public ResponseEntity<BudgetSummary> getBudgetSummary(
            @RequestParam Integer month,
            @RequestParam Integer year,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        BudgetSummary summary = bs.getBudgetSummary(
                user.getId(), month, year);

        if (summary == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(summary);
    }
}
