#include <gtest/gtest.h>
#include <fstream>
#include <string>

#include "AddCommand.h"
#include "Compressor.h"
#include "InputChecker.h"

using std::string;

static string readFile(const string& filename) {
    std::ifstream in(filename);
    return string((std::istreambuf_iterator<char>(in)),
                   std::istreambuf_iterator<char>());
}

TEST(AddCommandTest, SimpleCompressionAndResponse) {
    string file = "test1.txt";
    string data = "aaabbbccc";

    InputChecker ic;
    ic.filename = file;
    ic.data     = data;

    AddCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);

    EXPECT_EQ(response, "201 Created\n");

    EXPECT_EQ(readFile(file), "3#a3#b3#c");
}

TEST(AddCommandTest, EmptyStringAndResponse) {
    string file = "test2.txt";
    string data = "";

    InputChecker ic;
    ic.filename = file;
    ic.data     = data;

    AddCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);
    EXPECT_EQ(response, "201 Created\n");
    EXPECT_EQ(readFile(file), "");
}

TEST(AddCommandTest, SingleCharacterAndResponse) {
    string file = "test3.txt";
    string data = "q";

    InputChecker ic;
    ic.filename = file;
    ic.data     = data;

    AddCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);
    EXPECT_EQ(response, "201 Created\n");
    EXPECT_EQ(readFile(file), "1#q");
}
