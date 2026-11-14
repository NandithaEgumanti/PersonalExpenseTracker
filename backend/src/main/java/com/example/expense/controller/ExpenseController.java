
package com.example.expense.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.expense.entity.Expense;
import com.example.expense.entity.User;
import com.example.expense.service.ExpenseService;
import com.example.expense.service.UserService;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService service;
    private final UserService userService;

    public ExpenseController(
            ExpenseService service,
            UserService userService) {

        this.service = service;
        this.userService = userService;
    }

    // Find the currently logged-in user
    private User getLoggedInUser(Authentication authentication) {

        return userService.getUserByEmail(authentication.getName());
    }

    // Add expense
    @PostMapping
    public ResponseEntity<Expense> addExpense(
            @RequestBody Expense expense,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Expense saved = service.addExpense(expense, user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    // Get only logged-in user's expenses
    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                service.getExpensesByUser(user.getId()));
    }

    // Get one expense belonging to logged-in user
    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpense(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Expense expense = service.getExpenseById(
                id, user.getId());

        if (expense == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(expense);
    }

    // Update expense
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Integer id,
            @RequestBody Expense expense,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Expense updated = service.updateExpense(
                id, expense, user.getId());

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    // Delete expense
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }

        boolean deleted = service.deleteExpense(
                id, user.getId());

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                "Expense deleted successfully");
    }
}
