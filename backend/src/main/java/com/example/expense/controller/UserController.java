
package com.example.expense.controller;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.example.expense.entity.User;
import com.example.expense.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    // Register new user
    @PostMapping
    public ResponseEntity<User> addUser(@RequestBody User user) {
        User savedUser = service.addUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    // Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return service.getAllUsers();
    }

    // Get user by ID
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return service.getUserById(id);
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {

        if (service.getUserById(id) == null) {
            return ResponseEntity.notFound().build();
        }

        if (service.hasLinkedRecords(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete user because expenses or budgets are linked");
        }

        service.deleteUser(id);

        return ResponseEntity.ok("User deleted successfully");
    }
    

@GetMapping("/me")
public ResponseEntity<User> getCurrentUser(Authentication authentication) {

    User user = service.getUserByEmail(authentication.getName());

    if (user == null) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(user);
}
}