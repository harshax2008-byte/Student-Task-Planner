import com.studentplanner.*;
import java.util.*;
import java.time.LocalDate;

public class Main {
    private static TaskManager taskManager = new TaskManager();
    private static StudyTimer studyTimer = new StudyTimer();
    private static StreakTracker streakTracker = new StreakTracker();
    private static Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        boolean exit = false;
        
        while (!exit) {
            printMenu();
            String choice = scanner.nextLine();
            
            switch (choice) {
                case "1": addTask(); break;
                case "2": viewTasks(); break;
                case "3": completeTask(); break;
                case "4": undoLastAction(); break;
                case "5": deleteTask(); break;
                case "6": searchTasks(); break;
                case "7": runTimer(); break;
                case "8": viewStreak(); break;
                case "9": exit = true; break;
                default: System.out.println("Invalid choice. Please try again.");
            }
        }
        System.out.println("Goodbye, Scholar!");
    }

    private static void printMenu() {
        System.out.println("\n===== STUDENT TASK PLANNER =====");
        System.out.println("1. Add Task");
        System.out.println("2. View Tasks (Sorted by Deadline)");
        System.out.println("3. Complete Task");
        System.out.println("4. Undo Last Completion (Stack)");
        System.out.println("5. Delete Task");
        System.out.println("6. Search Task");
        System.out.println("7. Study Timer (Pomodoro)");
        System.out.println("8. View Streak");
        System.out.println("9. Exit");
        System.out.print("Choose an option: ");
    }

    private static void addTask() {
        System.out.print("Enter Task Name: ");
        String name = scanner.nextLine();
        
        System.out.print("Enter Category (Study/Assignment/Exam/Revision/Personal): ");
        String category = scanner.nextLine();
        
        System.out.print("Enter Date (YYYY-MM-DD): ");
        String date = scanner.nextLine();
        if (date.isEmpty()) date = LocalDate.now().toString();
        
        System.out.print("Enter Time (HH:mm): ");
        String time = scanner.nextLine();
        if (time.isEmpty()) time = "09:00";
        
        long id = System.currentTimeMillis();
        Task task = new Task(id, name, category, date, time);
        taskManager.addTask(task);
        System.out.println("Task added successfully!");
        
        // Trigger Pop-up Notification
        NotificationHelper.sendNotification("Task Added", "Mission scheduled: " + name);
        
        // Peek at what's next (Queue)
        Task next = taskManager.getNextUpcomingTask();
        if (next != null) {
            System.out.println("[INFO] Next upcoming mission: " + next.getName());
        }
    }

    private static void viewTasks() {
        System.out.println("\n--- TASK LIST (Sorted) ---");
        List<Task> tasks = taskManager.getAllTasksSorted();
        if (tasks.isEmpty()) {
            System.out.println("No tasks found.");
        } else {
            for (Task t : tasks) {
                System.out.println(t);
            }
        }
    }

    private static void completeTask() {
        System.out.print("Enter Task ID to complete: ");
        try {
            long id = Long.parseLong(scanner.nextLine());
            taskManager.markCompleted(id);
            streakTracker.recordTaskCompletion();
            System.out.println("Task marked as completed!");
        } catch (NumberFormatException e) {
            System.out.println("Invalid ID format.");
        }
    }

    private static void undoLastAction() {
        taskManager.undoLastCompletion();
        System.out.println("Reverted last completion.");
    }

    private static void deleteTask() {
        System.out.print("Enter Task ID to delete: ");
        try {
            long id = Long.parseLong(scanner.nextLine());
            if (taskManager.deleteTask(id)) {
                System.out.println("Task deleted.");
            } else {
                System.out.println("Task not found.");
            }
        } catch (NumberFormatException e) {
            System.out.println("Invalid ID format.");
        }
    }

    private static void searchTasks() {
        System.out.print("Enter search keyword: ");
        String query = scanner.nextLine();
        List<Task> results = taskManager.searchTasksByName(query);
        System.out.println("\n--- SEARCH RESULTS ---");
        for (Task t : results) {
            System.out.println(t);
        }
    }

    private static void runTimer() {
        studyTimer.startSession();
        System.out.println("Total time focused so far: " + studyTimer.getTotalMinutesStudied() + " mins");
    }

    private static void viewStreak() {
        System.out.println("\nYour current daily streak: 🔥 " + streakTracker.getCurrentStreak() + " Days");
    }
}
