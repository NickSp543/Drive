#ifndef THREADPOOL_H
#define THREADPOOL_H

#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <atomic>
#include <stdexcept>
#include <iostream> 

class ThreadPool {
private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    
    std::mutex queue_mutex;
    std::condition_variable condition;
    std::atomic<bool> stop;
    
    void worker_thread() {
        while (true) {
            std::function<void()> task;
            
            {
                std::unique_lock<std::mutex> lock(queue_mutex);
                
                // Wait until there's a task or stop signal
                condition.wait(lock, [this] {
                    return stop.load() || !tasks.empty();
                });
                
                // Exit if stopping and no more tasks
                if (stop.load() && tasks.empty()) {
                    return;
                }
                
                // Get next task
                task = std::move(tasks.front());
                tasks.pop();
            }
            
            // Execute task outside the lock
            if (task) {
                task();
            }
        }
    }
    
public:
    // Constructor: create thread pool with specified number of threads
    ThreadPool(size_t num_threads) : stop(false) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers.emplace_back([this] { worker_thread(); });
        }
    }
    
    // Destructor: stop all threads
    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            stop.store(true);
        }
        condition.notify_all();
        
        for (std::thread& worker : workers) {
            if (worker.joinable()) {
                worker.join();
            }
        }
    }
    
    // Add task to queue
    template<typename F>
    void enqueue(F&& task) {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            
            if (stop.load()) {
                throw std::runtime_error("Cannot enqueue on stopped ThreadPool");
            }
            
            tasks.emplace(std::forward<F>(task));
        }
        condition.notify_one();
    }
    
    // Get number of tasks
    size_t pending_tasks() {
        std::unique_lock<std::mutex> lock(queue_mutex);
        return tasks.size();
    }
};

#endif