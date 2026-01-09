#include <iostream>
#include <cstring>
#include <fstream>
#include <sstream>
#include <cctype>
#include "Compressor.h"
#include <algorithm>
#include <vector>
#include <filesystem>

using namespace std;
namespace fs = std::filesystem;

static vector<string> createdFiles;

void Compressor::loadExistingFiles() {
    const char* dir = getenv("DATA_DIR");

    string baseDir;
    
    if (dir && strlen(dir) > 0) {
        baseDir = string(dir); // data directory exists and isn't empty
    } else {
        baseDir = "."; // otherwise use current directory
    }

    try {
        // scan for files in the data directory
        for (const auto& entry : fs::directory_iterator(baseDir)) {
            if (entry.is_regular_file()) {
                string name = entry.path().filename().string(); // get filename as string
                createdFiles.push_back(name);
            }
        }
    }
    catch (const exception& e) {
        cerr << "Failed to scan directory: " << e.what() << endl;
    }
}

static std::string getOutputPath(const std::string& filename) {
    const char* dir = getenv("DATA_DIR");
    if (!dir || string(dir).empty())
        return filename;
    return string(dir) + "/" + filename;
}

void Compressor::add(const string& filename, const string& data) {
    string fullPath = getOutputPath(filename);
    ofstream CreatedFile(fullPath);
    if (find(createdFiles.begin(), createdFiles.end(), filename) == createdFiles.end())
        createdFiles.push_back(filename);

    if (!CreatedFile.is_open()) return;
    if (data.empty()) return;

    // write one run as "<count>#<char>"
    auto write_to_file = [&](char nextChar, int charCounter){
        CreatedFile << charCounter << "#" << nextChar;
    };

    int count = 1;
    char current = data[0];

    // simple run-length encode
    for (size_t i = 1; i < data.size(); ++i) {
        if (data[i] == current) {
            count++;
        } else {
            write_to_file(current, count);
            current = data[i];
            count = 1;
        }
    }

    write_to_file(current, count);
}

string Compressor::get(const string& filename) {
    string fullPath = getOutputPath(filename);
    ifstream file(fullPath);
    if (!file.is_open())
        return "";

    // read entire compressed file
    stringstream buffer;
    buffer << file.rdbuf();
    string compressed = buffer.str();

    string result;
    string num;
    bool readingCount = true;

    // parse "<count>#<char>" format
    for (size_t i = 0; i < compressed.size(); ++i) {
        char c = compressed[i];

        if (isdigit(c) && readingCount) {
            num += c;
        }
        else if (c == '#') {
            readingCount = false;
        }
        else {
            int count = stoi(num);
            result.append(count, c);
            num.clear();
            readingCount = true;
        }
    }

    return result;
}

std::vector<std::string> Compressor::search(const string& text) {
    vector<string> results;

    // return names of files whose decompressed content contains the text
    for (const string& filename : createdFiles) {
        string content = get(filename);
        if (content.find(text) != string::npos) // || filename.find(text) != string::npos)
            results.push_back(filename);
    }

    return results;
}

int Compressor::deletef(const string& filename) {
    std::string fullPath = getOutputPath(filename);

    std::error_code ec;
    bool removed = fs::remove(fullPath, ec); // try to delete the file

    if (ec) return -1; // filesystem error (permissions, etc)

    // remove the filename from the vector if it exists there
    auto file = find(createdFiles.begin(), createdFiles.end(), filename);
    if (file != createdFiles.end()) createdFiles.erase(file);

    if (!removed) return 1; // file not found

    return 0; // successful deletion
}