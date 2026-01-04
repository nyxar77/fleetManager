cmake_minimum_required(VERSION 3.20)
project(FleetManager LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS src/*.cpp)

add_executable(fleetManager
     main.cpp
    ${SOURCES}
)

target_include_directories(fleetManager PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_options(fleetManager PRIVATE -Wall -Wextra)

